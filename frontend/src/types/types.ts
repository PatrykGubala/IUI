interface BaseUser {
    firstName: string;
    lastName: string;
    age: number;
    location: string;
    description: string;
    tags: string[];
}


export interface FeedUser extends BaseUser {
    id: number;
    image: string;
    occupation: string;
    university: string;
}

export interface FeedItem {
    common: number;
    cosine: number;
    score: number;
    user: FeedUser;
}


export interface ProfileData extends BaseUser {
    gender: 'M' | 'F' | 'O';
    interestedIn: string[];
    max_distance: number;
    max_age_diff: number;
    profilePhoto: string;
}


export interface ValidationErrors {
    firstName?: string;
    lastName?: string;
    age?: string;
    description?: string;
    max_distance?: string;
    max_age_diff?: string;
}


