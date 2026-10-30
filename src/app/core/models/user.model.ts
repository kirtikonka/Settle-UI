export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  phone?: string;
}

export interface Friend extends User {
  balance: number; // positive: they owe you, negative: you owe them, 0: settled
  lastActivityDate?: string;
}
