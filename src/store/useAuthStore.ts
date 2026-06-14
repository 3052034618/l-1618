import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, UserRole } from "@/types";
import { mockUsers } from "@/mock/data";
import { generateId, getNowISOString } from "@/utils/generators";

interface AuthState {
  currentUser: User | null;
  users: User[];
  login: (username: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  registerVolunteer: (data: {
    username: string;
    password: string;
    email: string;
    phone: string;
  }) => { success: boolean; userId?: string; message?: string };
  isAuthenticated: () => boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: mockUsers,

      login: (username: string, password: string) => {
        const user = get().users.find(
          (u) => u.username === username && u.password === password
        );
        if (!user) {
          return { success: false, message: "用户名或密码错误" };
        }
        set({ currentUser: user });
        return { success: true };
      },

      logout: () => {
        set({ currentUser: null });
      },

      registerVolunteer: (data) => {
        const { users } = get();
        if (users.some((u) => u.username === data.username)) {
          return { success: false, message: "用户名已存在" };
        }
        const newUser: User = {
          id: generateId(),
          username: data.username,
          password: data.password,
          role: "volunteer",
          email: data.email,
          phone: data.phone,
          createdAt: getNowISOString(),
        };
        set({ users: [...users, newUser] });
        return { success: true, userId: newUser.id };
      },

      isAuthenticated: () => {
        return get().currentUser !== null;
      },

      hasRole: (roles: UserRole[]) => {
        const user = get().currentUser;
        return user !== null && roles.includes(user.role);
      },
    }),
    {
      name: "volunteer-auth-storage",
    }
  )
);
