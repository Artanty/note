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