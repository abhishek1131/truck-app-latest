"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "technician" | "admin" | "manager";
  status: "active" | "inactive" | "suspended" | "pending";
  created_at?: Date;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: "technician" | "admin" | "manager";
}

interface AuthResponse {
  success: boolean;
  data?: {
    user: { id: string; email: string };
    profile: {
      role: "technician" | "admin" | "manager";
      first_name: string;
      last_name: string;
      created_at: Date;
    };
    session: { access_token: string; expires_at: string };
  };
  error?: string;
  code?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  console.log("user",user);
  useEffect(() => {
    // Check localStorage for existing auth data
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("access_token");
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser) as User);
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Define public routes
    const publicRoutes = ["/", "/login", "/register"];
    
    // Redirect to login if user is not authenticated and trying to access non-public route
    if (!loading && !user && !publicRoutes.includes(pathname)) {
      router.push("/login");
    }
  }, [user, loading, pathname, router]);

  const register = async (registerData: RegisterData): Promise<boolean> => {
    try {
      setLoading(true);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });

      const result: AuthResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        console.error("Registration error:", result.error);
        return false;
      }

      // Store user data and token
      const { user: apiUser, profile, session } = result.data;
      const userData: User = {
        id: apiUser.id,
        email: apiUser.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        role: profile.role,
        status: "active",
      };
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("access_token", session.access_token);
      setUser(userData);
      setToken(session.access_token);

      return true;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result: AuthResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        console.error("Login error:", result.error);
        return false;
      }

      // Store user data and token
      const { user: apiUser, profile, session } = result.data;
      const userData: User = {
        id: apiUser.id,
        email: apiUser.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        role: profile.role,
        status: "active",
        created_at: profile.created_at,
      };
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("access_token", session.access_token);
      setUser(userData);
      setToken(session.access_token);

      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("access_token");
      localStorage.clear();
      setUser(null);
      setToken(null);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}