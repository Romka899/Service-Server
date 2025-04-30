export interface SessionUser{
    id:string;
    username:string;
    role:string;
    loggedInAt?:Date;
}

export interface AuthResponse {
    status: 'success' | 'error';
    message?: string; 
    data: {
        user: {
            id: string;
            username: string;
            role: string;
            loggedInAt?: Date;
          };
    };
  }