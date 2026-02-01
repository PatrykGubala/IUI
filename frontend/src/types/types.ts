export interface MatchItem {
    match_id: number;
    name: string;
    subtitle: string;
    time: string;
    message: string;
    avatar: string | null;
}

export type MessageType = "incoming" | "outgoing";

export interface MessageItem {
    id: number;
    user: string;
    content: string;
    time: string;
    type: MessageType;
    match_id?: number;
}


export interface FeedUser {
    id: number;
    image: string;
    firstName: string;
    lastName: string;
    age: number;
    location: string;
    occupation: string;
    university: string;
    description: string;
    tags: string[];
}

export interface FeedItem {
    common: number;
    cosine: number;
    score: number;
    user: FeedUser;
}

export interface MatchCard extends FeedUser {}