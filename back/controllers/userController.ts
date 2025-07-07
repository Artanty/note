class UserController {

	static async getUserDataFromRequest(req: any) {
		return (req.headers as any)['user-handle'] // Get user from header instead of body
	}
}
export default UserController;