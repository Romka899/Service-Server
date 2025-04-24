export interface LoginResponse {
  message: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}