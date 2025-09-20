import { Request } from 'express';

export const getAUBackUrlFromRequest = (req: Request): string => {
	const data = req.headers['x-au-back-url'];
    
	if (!data) {
		throw new Error("Missing 'x-user-handler' header");
	}
    
	return String(data);
};