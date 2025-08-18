import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import { dd } from '../utils/dd';

const KEY_BACK_URL = process.env.KEY_BACK_URL;

export async function validateApiKey(req: Request, res: Response, next: NextFunction) {
  dd('validateApiKey START');

  // Quick validation with early returns
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    dd('Missing/invalid Authorization header');
    return res.status(401).json({ error: 'Bearer token required' });
  }

  const token = authHeader.split(' ')[1];
  const requesterProject = req.headers['x-requester-project'];
  const requesterUrl = req.headers['x-requester-url'];

  dd('Params:', { 
    token: token ? '****' + token.slice(-4) : 'MISSING',
    requesterProject: requesterProject || 'MISSING', 
    requesterUrl: requesterUrl || 'MISSING' 
  });

  if (!token || !requesterProject || !requesterUrl) {
    dd('Missing required parameters');
    return res.status(400).json({ 
      error: 'Missing parameters',
      requires: ['authorization: Bearer <token>', 'x-requester-project', 'x-requester-url']
    });
  }

  try {
    const response = await axios.post(`${KEY_BACK_URL}/validate`, {
      requesterProject,
      requesterApiKey: token,
      requesterUrl
    }, {
      headers: {
        'X-Project-Id': process.env.PROJECT_ID,
        'X-Project-Domain-Name': `${req.protocol}://${req.get('host')}`,
        'X-Api-Key': process.env.BASE_KEY
      }
    });

    if (!response.data.valid) {
      dd('Invalid token response');
      return res.status(403).json({ error: 'Invalid token' });
    }

    dd('validateApiKey END - Valid');
    next();
  } catch (error: any) {
    console.error('Validation failed:', error.message);
    res.status(500).json({ error: 'Token validation failed' });
  }
}