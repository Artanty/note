export interface Keyword {
	id: number;
	name: string;
	color: number;
	created_at: string;
	updated_at: string;
}

export interface KeywordAccess {
	keyword_id: number;
	user_handle: string;
	access_level: number;
}


export interface KeywordUser {
	"enrichedUsersData": [
		{
			"name": string
			"id": string
			"userHandler": string
			"providerId": string
			"avatar": string
		}
	]
}

export interface KeywordUsersRes {
	enrichedUsersData: KeywordUser[]
}

export interface ShareKeywordRes {
	"success": boolean
}