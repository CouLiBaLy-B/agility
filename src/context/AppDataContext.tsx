import { createContext, useContext, type Dispatch, type SetStateAction } from 'react';
import { users as fallbackUsers } from '../data/boards';
import type { User } from '../data/boards';
import type { ApiUser, WorkspaceSummary } from '../api/auth';

export type AppUser = User & Partial<Pick<ApiUser, 'email' | 'role'>>;

interface AppDataContextValue {
  users: AppUser[];
  setUsers?: Dispatch<SetStateAction<AppUser[]>>;
  currentUser: AppUser;
  setCurrentUser?: Dispatch<SetStateAction<AppUser>>;
  workspace: WorkspaceSummary | null;
}

const usersWithFallbackMetadata: AppUser[] = fallbackUsers.map((user, index) => ({
  ...user,
  email: `${user.name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
  role: index === 0 ? 'admin' : 'member',
}));

const fallbackCurrentUser = usersWithFallbackMetadata[0];

const AppDataContext = createContext<AppDataContextValue>({
  users: usersWithFallbackMetadata,
  currentUser: fallbackCurrentUser,
  workspace: {
    id: 'w1',
    name: 'WorkSpace',
    slug: 'workspace',
    currentUserRole: 'admin',
  },
});

export const AppDataProvider = AppDataContext.Provider;

export function useAppData() {
  return useContext(AppDataContext);
}

export function useUsers() {
  return useAppData().users;
}

export function useCurrentUser() {
  return useAppData().currentUser;
}
