import dotenv from 'dotenv';
import createPool from '../core/db_connection';
import axios from 'axios';
import { getAUBackUrlFromRequest } from '../utils/getAUBackUrlFromRequest';
import { Request } from 'express';
import { obtainApiKey } from '../middlewares/obtainApiKey';
import { dd } from '../utils/dd';
import { AuEnrichedUser, AuEnrichedUserRes, KeywordToUser } from './keywordController.types';
import { swapObject } from '../utils/swap-object';
import { AccessLevel } from '../constants/access-levels.constant';

dotenv.config();
 
class KeywordController { 
	// Create keyword and assign owner access
	static async createKeyword(name: string, color: number, userHandle: string) {

		const pool = createPool();
		const connection = await pool.getConnection();
		try {
			await connection.beginTransaction();

			// Insert keyword
			const [keywordResult] = await connection.execute(
				'INSERT INTO keywords (name, color) VALUES (?, ?)',
				[name, color]
			);
			const keywordId = keywordResult.insertId;

			// Create owner relationship (1 - read, 2 - write, 3 - admin, 4 - owner)
			await connection.execute(
				'INSERT INTO keyword_to_user (keyword_id, user_handler, access_level) VALUES (?, ?, ?)',
				[keywordId, userHandle, 4]
			);		

			await connection.commit();
			return keywordId;
		} catch (error) { 
			console.log(error)
			await connection.rollback();
			throw error;
		} finally {
			connection.release();
		}
	}

	static async updateKeyword(
		keywordId: number,
		userHandler: string,
		updates: { name?: string; color?: number }
	) {
		const pool = createPool();
		const connection = await pool.getConnection();
		try {
			await connection.beginTransaction();

			// Verify user has write/admin/owner access (access_level >= 2)
			const [accessCheck] = await connection.execute(
				'SELECT 1 FROM keyword_to_user WHERE keyword_id = ? AND user_handler = ? AND access_level >= 2',
				[keywordId, userHandler]
			);

			if (accessCheck.length === 0) {
				throw new Error('No permission to update this keyword');
			}

			// Build dynamic UPDATE query based on provided fields
			const updateFields: string[] = [];
			const queryParams: any[] = [];

			if (updates.name !== undefined) {
				updateFields.push('name = ?');
				queryParams.push(updates.name);
			}

			if (updates.color !== undefined) {
				updateFields.push('color = ?');
				queryParams.push(updates.color);
			}

			// If no valid fields to update, return early
			if (updateFields.length === 0) {
				await connection.commit();
				return true;
			}

			// Add keywordId to parameters for WHERE clause
			queryParams.push(keywordId);

			// Execute update
			const [result] = await connection.execute(
				`UPDATE keywords SET ${updateFields.join(', ')} WHERE id = ?`,
				queryParams
			);

			await connection.commit();
	        
			// Return true if any rows were affected
			return (result as any).affectedRows > 0;
		} catch (error) {
			await connection.rollback();
			throw error;
		} finally {
			connection.release();
		}
	}

	// Delete keyword and all its relations (cascades)
	static async deleteKeyword(keywordId: number, userHandler: string,) {
		const pool = createPool();
		const [result] = await pool.execute(
			`DELETE k FROM keywords k
             JOIN keyword_to_user ku ON k.id = ku.keyword_id
             WHERE k.id = ? AND ku.user_handler = ? AND ku.access_level >= 3`,
			[keywordId, userHandler]
		);
		return result.affectedRows > 0;
	}
	
	// Get keyword by ID with access check
	static async getKeyword(keywordId: number, userHandler: string) {
		const pool = createPool();
		const [rows] = await pool.execute(
			`SELECT k.*, ku.access_level 
             FROM keywords k
             JOIN keyword_to_user ku ON k.id = ku.keyword_id
             WHERE k.id = ? AND ku.user_handler = ?`,
			[keywordId, userHandler]
		);
		return rows[0] || null;
	}

	static async getTargetUserHandler(
		req: Request, 
		targetProjectId: string,
		targetUserProviderId: string,
		targetUserId: string
	): Promise<string> {
		try {
			// get api key from key@back to make request to au@back
			const thisBackOrigin = `${req.protocol}://${req.get('host')}` 
			const backendUrlForRequest = getAUBackUrlFromRequest(req);

			const backendServiceToken = await obtainApiKey(
				targetProjectId, // target project, f.e: au@abck
				backendUrlForRequest, // target URL, f.e: http://localhost:3214
				thisBackOrigin // requester url (this back url), f.e: http://localhost:3224
			)

			const payload = {
				targetUserProviderId,
				targetUserId,
			};
			// todo предоставлять внешнее апи в момент шаринга токена
			const response = await axios.post(
				`${backendUrlForRequest}/api/users/encrypt`, 
				payload,
				{
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${backendServiceToken.token}`,
						'X-Requester-Project': process.env.PROJECT_ID,
						'X-Requester-Url': thisBackOrigin
					},
					timeout: 5000
				}
			);
			const result = response.data?.userHandler
			if (!result || (typeof result !== 'string')) {
				throw new Error('wrong userHandler format')
			}

			return result;
		} catch (error) {
			throw new Error('[GET TARGET USER HANDLER]: ' + error)
		}
		
	}
	// Share keyword with another user
	static async shareKeyword(
		currentUserHandler: string,
		keywordId: number, 
		targetUserProviderId: string,
		targetUserId: string,
		accessLevel: number,
		req: Request
	) {
		const targetUserHandler = await this.getTargetUserHandler(
			req,
			'au@back', 
			targetUserProviderId, 
			targetUserId
		)

		const pool = createPool();
		const connection = await pool.getConnection();
		try {
			await connection.beginTransaction();

			// Verify owner has admin rights
			const [ownerCheck] = await connection.execute(
				'SELECT access_level FROM keyword_to_user WHERE keyword_id = ? AND user_handler = ? AND access_level >= 3',
				[keywordId, currentUserHandler]
			);
			dd('ownerCheck')
			dd(ownerCheck)
			if ((targetUserHandler === currentUserHandler) && (ownerCheck[0].access_level === 4)) {
				throw new Error('Can not change owner status');
			}

			if (ownerCheck.length === 0) {
				throw new Error('No permission to share this keyword');
			}

			// Create or update sharing relationship
			await connection.execute(
				`INSERT INTO keyword_to_user (keyword_id, user_handler, access_level)
		         VALUES (?, ?, ?)
		         ON DUPLICATE KEY UPDATE access_level = ?`,
				[keywordId, targetUserHandler, accessLevel, accessLevel]
			);

			await connection.commit();
			return true;
		} catch (error) {
			await connection.rollback();
			throw error;
		} finally {
			connection.release();
		}
	}

	// UNShare keyword - remove link-entry from keywordToUser table
	static async unshareKeyword(
		currentUserHandler: string,
		keywordId: number, 
		targetUserProviderId: string,
		targetUserId: string,
		req: Request
	) {
		const targetUserHandler = await this.getTargetUserHandler(
			req,
			'au@back', 
			targetUserProviderId, 
			targetUserId
		)

		const pool = createPool();
		const connection = await pool.getConnection();
		try {
			await connection.beginTransaction();

			// Verify owner has admin rights todo: fix query
			const [ownerCheck] = await connection.execute(
				'SELECT 1 FROM keyword_to_user WHERE keyword_id = ? AND user_handler = ? AND access_level >= 3',
				[keywordId, currentUserHandler]
			);

			if (ownerCheck.length === 0) {
				throw new Error('No permission to unshare this keyword');
			}

			// Prevent user from removing their own access if they're the owner
			const [ownerCheck2] = await connection.execute(
				'SELECT 1 FROM keyword_to_user WHERE keyword_id = ? AND user_handler = ? AND access_level = 4',
				[keywordId, currentUserHandler]
			);

			if (targetUserHandler === currentUserHandler && ownerCheck2.length > 0) {
				throw new Error('Cannot remove your own owner access');
			}

			// Remove the sharing relationship
			const [result] = await connection.execute(
				'DELETE FROM keyword_to_user WHERE keyword_id = ? AND user_handler = ?',
				[keywordId, targetUserHandler]
			);

			await connection.commit();
			
			// Return true if a row was actually deleted
			return (result as any).affectedRows > 0;

		} catch (error) {
			await connection.rollback();
			throw error;
		} finally {
			connection.release();
		}
	}

	// List all keywords accessible to a user
	static async getUserKeywords(userHandler: string) {
		console.log('userHandler: ' + userHandler)
		const pool = createPool();
		const connection = await pool.getConnection();
		try {
			await connection.beginTransaction();

			const [rows] = await pool.execute(
				`SELECT k.*, ku.access_level 
	             FROM keywords k
	             JOIN keyword_to_user ku ON k.id = ku.keyword_id
	             WHERE ku.user_handler = ?`,
				[userHandler]
			);
			
			await connection.commit();
			return rows;
		} catch (error) { 
			console.log(error)
			await connection.rollback();
			throw error;
		} finally {
			connection.release();
		}
	}

	// List all users accessible to a keyword
	static async getKeywordUsers(userHandler: string, req: Request) {
		const keywordId: number = req.body.keywordId;
		const pool = createPool();
		const connection = await pool.getConnection();
		try {
			await connection.beginTransaction();

			const [rows] = await pool.execute(
				`SELECT * 
		         FROM keyword_to_user
		         WHERE keyword_id = ?`,
				[keywordId]
			);

			await connection.commit();

			const isOwner = rows.find((row: KeywordToUser) => (row.user_handler === userHandler) && (row.access_level === 4))
			if (!isOwner) {
				throw new Error('no permissions to view keyword users.')
			}
			const userToAccessLevelMap: Record<string, number> = rows.reduce((acc: any, curr: KeywordToUser) => {
				acc[curr.user_handler] = curr.access_level;
				return acc;
			}, {})
			//mb keep all profile info in handler after login?
			const userHandlers = rows.map((row: any) => row.user_handler)
			const auUsers = await this.getUsersByHandlers(req, 'au@back', userHandlers)
			auUsers.enrichedUsersData.map((enrichedUser: any) => {
				enrichedUser.accessLevel = this.getUserRole(userToAccessLevelMap[enrichedUser.userHandler])
				return enrichedUser;
			})

			return auUsers;
		} catch (error) { 
			console.log(error)
			await connection.rollback();
			throw error;
		} finally {
			connection.release();
		}
	}

	// todo: every app has its own access levels? keep in user obj?
	private static getUserRole(accessLevel: number): string {
		try {
			const accessLevelMap = swapObject(AccessLevel);
			return accessLevelMap[accessLevel]	
		} catch (e) {
			console.log(`[ERROR getUserRole]: ${e}`)
			return 'UNKNOWN';
		}
		
	}

	static async getUsersByHandlers(
		req: Request, 
		targetProjectId: string,
		usersHandlers: string[]
	): Promise<AuEnrichedUserRes> {
		// get api key from key@back to make request to au@back
		const thisBackOrigin = `${req.protocol}://${req.get('host')}` 
		const backendUrlForRequest = getAUBackUrlFromRequest(req);

		const backendServiceToken = await obtainApiKey(
			targetProjectId, // target project, f.e: au@abck
			backendUrlForRequest, // target URL, f.e: http://localhost:3214
			thisBackOrigin // requester url (this back url), f.e: http://localhost:3224
		)

		const payload = {
			usersHandlers: usersHandlers
		};
		
		const response = await axios.post(
			`${backendUrlForRequest}/api/users/decrypt`, 
			payload,
			{
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${backendServiceToken.token}`,
					'X-Requester-Project': process.env.PROJECT_ID,
					'X-Requester-Url': thisBackOrigin
				},
				timeout: 5000
			}
		);

		return response.data
	}
}

export default KeywordController;