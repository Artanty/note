import dotenv from 'dotenv';
import createPool from '../core/db_connection';
import axios from 'axios';
import { getAUBackUrlFromRequest } from '../utils/getAUBackUrlFromRequest';
import { Request } from 'express';
import { obtainApiKey } from '../middlewares/obtainApiKey';

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

			// Create owner relationship (1 - read, 2 - write, 3 - admin)
			await connection.execute(
				'INSERT INTO keyword_to_user (keyword_id, user_handler, access_level) VALUES (?, ?, ?)',
				[keywordId, userHandle, 3]
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

	// Update keyword (name and/or color)
	static async updateKeyword(keywordId: number, userHandler: string, updates: any) {

		const fields = [];
		const values = [];

		if (updates.name !== undefined) {
			fields.push('name = ?');
			values.push(updates.name);
		}
		if (updates.color !== undefined) {
			fields.push('color = ?');
			values.push(updates.color);
		}

		if (fields.length === 0) {
			throw new Error('No fields to update1');
		}

		values.push(keywordId, userHandler);
		const pool = createPool();
		const [result] = await pool.execute(
			`UPDATE keywords k
             JOIN keyword_to_user ku ON k.id = ku.keyword_id
             SET ${fields.join(', ')}
             WHERE k.id = ? AND ku.user_handler = ? AND ku.access_level >= 2`,
			values
		);

		return result.affectedRows > 0;
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

			// Verify owner has admin rights todo: fix query
			const [ownerCheck] = await connection.execute(
				'SELECT 1 FROM keyword_to_user WHERE keyword_id = ? AND user_handler = ? AND access_level >= 3',
				[keywordId, currentUserHandler]
			);

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

			const isOwner = rows.find((row: any) => (row.user_handler === userHandler) && (row.access_level === 4))
			if (!isOwner) {
				throw new Error('no permissions to view keyword users.')
			}

			// todo:
			// rows:
			// [
			//     {
			//         "id": 36,
			//         "keyword_id": 50,
			//         "user_handler": "50dfb3b475194ee968984462",
			//         "access_level": 2,
			//         "created_at": "2025-09-20T08:00:00.000Z"
			//     }
			// ]
			// 1. make request [userHandlers] to au@back and retrieve [{
			// 	userHandler,
			// 	userName,
			// 	avatar
			// }]
			// 2. enrich rows and return response
			// /api/users/decrypt
			// return rows;

			//mb keep all profile info in handler after login?¢
			const userHandlers = rows.map((row: any) => row.user_handler)
			return await this.getUsersByHandlers(req, 'au@back', userHandlers)
		} catch (error) { 
			console.log(error)
			await connection.rollback();
			throw error;
		} finally {
			connection.release();
		}
	}

	static async getUsersByHandlers(
		req: Request, 
		targetProjectId: string,
		usersHandlers: string[]
	) {
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