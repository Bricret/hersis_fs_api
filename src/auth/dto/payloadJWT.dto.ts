export interface PayloadJWT {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    name: string;
    username: string;
}


export interface UserAuth extends PayloadJWT {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    name: string;
    username: string;
}