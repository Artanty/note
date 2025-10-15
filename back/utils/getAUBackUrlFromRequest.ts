import { Request } from 'express';

export const getAUBackUrlFromRequest = (req: Request): string => {
	const data = req.headers['x-au-back-url'];
    
	if (!data) {
		throw new Error("Missing 'x-au-back-url' header. use patchAUBackUrlHeader middleware");
	}
    
	return String(data);
};