import dotenv from 'dotenv';
import createPool from '../core/db_connection';

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

			// Create owner relationship (access_level 2 = admin)
			await connection.execute(
				'INSERT INTO keyword_to_user (keyword_id, user_handle, access_level) VALUES (?, ?, ?)',
				[keywordId, userHandle, 2]
			);

			await connection.commit();
			return keywordId;
		} catch (error) {
			await connection.rollback();
			throw error;
		} finally {
			connection.release();
		}
	}

	// Get keyword by ID with access check
	static async getKeyword(keywordId: number, userHandle: string) {
		const pool = createPool();
		const [rows] = await pool.execute(
			`SELECT k.*, ku.access_level 
             FROM keywords k
             JOIN keyword_to_user ku ON k.id = ku.keyword_id
             WHERE k.id = ? AND ku.user_handle = ?`,
			[keywordId, userHandle]
		);
		return rows[0] || null;
	}

	// Update keyword (name and/or color)
	static async updateKeyword(keywordId: number, userHandle: string, updates: any) {

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
			throw new Error('No fields to update');
		}

		values.push(keywordId, userHandle);
		const pool = createPool();
		const [result] = await pool.execute(
			`UPDATE keywords k
             JOIN keyword_to_user ku ON k.id = ku.keyword_id
             SET ${fields.join(', ')}
             WHERE k.id = ? AND ku.user_handle = ? AND ku.access_level >= 2`,
			values
		);

		return result.affectedRows > 0;
	}

	// Delete keyword and all its relations (cascades)
	static async deleteKeyword(keywordId: number, userHandle: string,) {
		const pool = createPool();
		const [result] = await pool.execute(
			`DELETE k FROM keywords k
             JOIN keyword_to_user ku ON k.id = ku.keyword_id
             WHERE k.id = ? AND ku.user_handle = ? AND ku.access_level >= 2`,
			[keywordId, userHandle]
		);
		return result.affectedRows > 0;
	}

	// Share keyword with another user
	static async shareKeyword(keywordId: number, ownerHandle: string, targetHandle: any, accessLevel = 1) {
		const pool = createPool();
		const connection = await pool.getConnection();
		try {
			await connection.beginTransaction();

			// Verify owner has admin rights
			const [ownerCheck] = await connection.execute(
				'SELECT 1 FROM keyword_to_user WHERE keyword_id = ? AND user_handle = ? AND access_level >= 2',
				[keywordId, ownerHandle]
			);

			if (ownerCheck.length === 0) {
				throw new Error('No permission to share this keyword');
			}

			// Create or update sharing relationship
			await connection.execute(
				`INSERT INTO keyword_to_user (keyword_id, user_handle, access_level)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE access_level = ?`,
				[keywordId, targetHandle, accessLevel, accessLevel]
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

	// List all keywords accessible to a user
	static async getUserKeywords(userHandle: string) {
		const pool = createPool();
		const [rows] = await pool.execute(
			`SELECT k.*, ku.access_level 
             FROM keywords k
             JOIN keyword_to_user ku ON k.id = ku.keyword_id
             WHERE ku.user_handle = ?`,
			[userHandle]
		);
		return rows;
	}
}

export default KeywordController;