import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import { dd } from '../utils/dd';

import { StorageService } from '../utils/storageService';

// Sanitize path components - DUPLICATE todo replace
function sanitizePath(input: string) {
  return input
    .replace(/\.\./g, '')        // Remove parent directory references
    .replace(/[^\w\-.%]/g, '_')  // Replace special chars with underscore
    .replace(/\/+/g, '/')        // Collapse multiple slashes
    .replace(/^\/|\/$/g, '');    // Trim leading/trailing slashes
}

export async function validateUserAccessToken(req: Request, res: Response, next: NextFunction) {
  dd('validateUserAccessToken START');

  // Quick validation with early returns
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    dd('Missing/invalid Authorization header');
    return res.status(401).json({ error: 'Bearer token required' });
  }

  const accessToken = authHeader.split(' ')[1];
  
  const hostOrigin = String(req.headers['x-requester-url']);

  dd('Params:', { 
    accessToken: accessToken ? '****' + accessToken.slice(-4) : 'MISSING',
    hostOrigin: hostOrigin || 'MISSING' 
  });

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
  
    console.log('encodedHostOrigin_forPath: ' + encodedHostOrigin_forPath)
    console.log('safePath: ' + safePath)

    // 6.1 check variable in storage service
    const variable = StorageService.get(safePath);
    
    // res.json({
    //   variable
    // });
    // const response = await axios.post(`${KEY_BACK_URL}/validate`, {
    //   requesterApiKey: token,
    //   requesterUrl
    // }, {
    //   headers: {
    //     'X-Project-Id': process.env.PROJECT_ID,
    //     'X-Project-Domain-Name': `${req.protocol}://${req.get('host')}`,
    //     'X-Api-Key': process.env.BASE_KEY
    //   }
    // });
    console.log('variable.accessToken: ' + variable.accessToken)
    console.log('saved in memory accessToken: ' + accessToken)

    if (!variable || (variable.accessToken !== accessToken)) {
      dd('NO variable in memory or did not match');
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.headers['x-user-handler'] = variable.userHandler;
    dd('validate user access token END - Valid');
    next();
  } catch (error: any) {
    console.error('Validation failed:', error.message);
    res.status(500).json({ error: 'Token validation failed' });
  }
}