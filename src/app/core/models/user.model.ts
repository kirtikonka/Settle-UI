export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  phone?: string;
}

export interface Friend extends User {
  balance: number;
  lastActivityDate?: string;
}
