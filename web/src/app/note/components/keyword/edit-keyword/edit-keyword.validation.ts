export const validateShareKeyword = (
	keywordId: number, 
	targetUserProviderId: string,
	targetUserId: string, 
	accessLevel: number) => {
	if (Number(targetUserProviderId) === 0) {
		throw new Error('targetUserProviderId can\'t be 0')
	}
	if (Number(targetUserId) === 0) {
		throw new Error('targetUserId can\'t be 0')
	}
}