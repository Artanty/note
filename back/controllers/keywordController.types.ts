export interface AuEnrichedUser {
    "name": string
    "id": string
    "userHandler": string
    "providerId": string
    "avatar": string
    "providerName": string
}

export interface AuEnrichedUserRes {
    enrichedUsersData: AuEnrichedUser[]
}

export interface KeywordToUser {
    "id": number
    "keyword_id": number
    "user_handler": string
    "access_level": number
    "created_at": string
}