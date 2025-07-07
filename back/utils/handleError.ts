export function handleError(res: Response, error: unknown) {
	(res as any).status(500).json(
		{ error: (error as any)?.message ? (error as any).message : error }
	);
}