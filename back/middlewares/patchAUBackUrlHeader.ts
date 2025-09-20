import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import { dd } from '../utils/dd';
import path from 'path';
import { checkFileWithData } from '../utils/fileStorageService';
import { MemoryStorageService } from '../utils/memoryStorageService';
import { sanitizePath } from '../utils/sanitizePath';
const STORAGE_ROOT = path.join(__dirname, '..', 'storage');

export async function patchAUBackUrlHeader(req: Request, res: Response, next: NextFunction) {
	dd('patch x-au-back-url START');

	const authHeader = req.headers['authorization'];
	if (!authHeader?.startsWith('Bearer ')) {
		dd('Missing/invalid Authorization header');
		return res.status(401).json({ error: 'Bearer token required' });
	}

	const accessToken = authHeader.split(' ')[1];
  
	const hostOrigin = String(req.headers['x-requester-url']);

	if (!accessToken || !hostOrigin) {
		dd('Missing required parameters');
		return res.status(400).json({ 
			error: 'Missing parameters',
			requires: ['authorization: Bearer <token>', 'x-requester-url']
		});
	}

	try {
		// пробуем достать переменную из памяти
		const encodedHostOrigin_forPath = encodeURIComponent(hostOrigin)
		const safePath = sanitizePath(encodedHostOrigin_forPath.toString());
		const memStoreVariable = MemoryStorageService.get(safePath);
    
		let matchedData: any = null
		if (!memStoreVariable || (memStoreVariable.accessToken !== accessToken)) {
			dd('NO variable in memory store or did not match. trying file store...');

			// try to get from file
			const fileName = `token.json`;
			const safeFileName = sanitizePath(fileName.toString());
			// Build storage path
			const storageDir = path.join(STORAGE_ROOT, safePath);
			const filePath = path.join(storageDir, safeFileName);

			const fileStoreVariable = await checkFileWithData(
				filePath, 
				{ accessToken }, 
				'accessToken', 
				true
			)

			if (!fileStoreVariable) {
				dd('NO variable in file store or did not match. 403');
				return res.status(403).json({ error: 'Invalid token' });
			} else {
				matchedData = fileStoreVariable
				MemoryStorageService.set(safePath, fileStoreVariable);
				dd('FOUND variable in file store. SAVED in mem store');
			}
      
		} else {
			matchedData = memStoreVariable
			dd('FOUND variable in mem store.');
		}
    
		req.headers['x-au-back-url'] = matchedData.auBackUrl;
		dd('patch x-au-back-url END - Valid');
		next();
	} catch (error: any) {
		console.error('patch x-au-back-url failed:', error.message);
		res.status(500).json({ error: 'patch x-au-back-url failed' });
	}
}