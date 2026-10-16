export interface DemoUser {
  email: string;
  name: string;
  isAdmin: boolean;
}

export const DEMO_PASSWORD = 'password123';

export const DEMO_USERS: DemoUser[] = [
  { email: 'alex@example.com', name: 'Alex Developer', isAdmin: false },
  { email: 'maya@example.com', name: 'Maya Reyes', isAdmin: false },
  { email: 'liam@example.com', name: 'Liam Carter', isAdmin: false },
  { email: 'sofia@example.com', name: 'Sofia Nguyen', isAdmin: false },
  { email: 'ethan@example.com', name: 'Ethan Park', isAdmin: false },
  { email: 'ava@example.com', name: 'Ava Santos', isAdmin: false },
  { email: 'noah@example.com', name: 'Noah Kim', isAdmin: false },
];

export const BOOTSTRAP_ADMIN: DemoUser = {
  email: 'vegastristan1@gmail.com',
  name: 'Tristan Vegas',
  isAdmin: true,
};

export const ALL_SEED_USERS: DemoUser[] = [...DEMO_USERS, BOOTSTRAP_ADMIN];
