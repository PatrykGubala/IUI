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
