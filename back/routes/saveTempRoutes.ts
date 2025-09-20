import express, { Request, Response } from 'express';

import { promises as fs } from 'fs';
import path from 'path';
import { validateApiKey } from '../middlewares/validateApiKey';
import { checkFileWithData } from '../utils/fileStorageService';
import { MemoryStorageService } from '../utils/memoryStorageService';
import { sanitizePath } from '../utils/sanitizePath';


const router = express.Router();

const STORAGE_ROOT = path.join(__dirname, '..', 'storage');

export interface SaveTempReqData { // rename to universal, replace somewhere
  token: string
  hostOrigin: string // same
}

export interface SaveTempReq { // rename to universal, replace somewhere
  path: string // same
  fileName: string
  data: SaveTempReqData
}

// Ensure directory exists
async function ensureDirExists(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err: unknown) {
    if ((err as any).code !== 'EEXIST') throw err;
  }
}

/**
 * req.body:
 * @param path string
 * @param fileName string
 * @param data: {
 *   userHandler: string,
 *   accessToken: string
 *   refreshToken: string
 * }
 * file will be saved to:
 * /${env.SAVE_TEMP_FOLDER}/${path}/${fileName}
 * with json ${data} content
 * */
router.post('/save', validateApiKey, async (req: Request, res: Response) => {
  try {
    // 1. Validate request body
    const { path: rawPath, fileName, data } = req.body as SaveTempReq;
    
    if (!rawPath || !fileName || !data) {
      return res.status(400).json({ 
        message: 'path, fileName and data are required' 
      });
    }

    // 2. Sanitize inputs (treating path as literal string)
    const safePath = sanitizePath(rawPath.toString());
    const safeFileName = sanitizePath(fileName.toString());

    // 3. Build storage path
    const storageDir = path.join(STORAGE_ROOT, safePath);
    const filePath = path.join(storageDir, safeFileName);

    // 4. Ensure directory exists
    await ensureDirExists(storageDir);

    // 6. Write to file
    await fs.writeFile(
      filePath,
      JSON.stringify(data, null, 2),
      'utf8'
    );

    // 6.1 save to variable in storage service
    MemoryStorageService.set(safePath, data);

    // 7. Respond with success
    res.json({
      success: true,
      message: 'Data saved successfully',
      storagePath: path.relative(STORAGE_ROOT, filePath),
    });

  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({
      message: 'Failed to save data',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message,
        stack: error.stack
      })
    });
  }
});



 
// export interface CheckTokenReq {
//   hostOrigin: string - адрес хоста, который нужно переслать
//   data: { token: string, hostOrigin; string } 
// }

router.post('/check', async (req, res) => {

  const hostOrigin = req.body.hostOrigin; // оставлено явной передачей для дебага
  const fileName = `token.json`;
  const dataToCompare = req.body.data
 
  const encodedHostOrigin_forPath = encodeURIComponent(hostOrigin) // передлать на получение его из запроса?

  // 2. Sanitize inputs (treating path as literal string)
  const safePath = sanitizePath(encodedHostOrigin_forPath.toString());
  const safeFileName = sanitizePath(fileName.toString());

  // 3. Build storage path
  const storageDir = path.join(STORAGE_ROOT, safePath);
  const filePath = path.join(storageDir, safeFileName);
  
  const validateResult = await checkFileWithData(filePath, dataToCompare, 'accessToken', false)

  // http%3A%2F%2Flocalhost%3A4222
  // http%3A%2F%2Flocalhost%3A4222
  res.json({
    // PORT: process.env.PORT,
    // hostOrigin,
    // encodedHostOrigin_forPath,
    // safePath,
    // safeFileName,
    // storageDir,
    // filePath,
    // dataToCompare,
    validateResult,
  });
})

// todo only for dev env
router.post('/check-var', async (req, res) => {

  const hostOrigin = req.body.hostOrigin;
 
  const encodedHostOrigin_forPath = encodeURIComponent(hostOrigin)
  const safePath = sanitizePath(encodedHostOrigin_forPath.toString());
  
  // 6.1 check variable in storage service
  const variable = MemoryStorageService.get(safePath);

  res.json({
    variable
  });
})

export default router;