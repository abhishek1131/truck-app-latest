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
  phone?: string | null;
  role: "technician" | "super_admin" | "company_admin";
  status: "active" | "inactive" | "suspended" | "pending";
  created_at?: Date;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  clearAuth: () => void;
  loading: boolean;
}

interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: "technician" | "super_admin" | "company_admin";
}

interface AuthResponse {
  success: boolean;
  data?: {
    user: { id: string; email: string };
    profile: {
      role: "technician" | "super_admin" | "company_admin";
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

  useEffect(() => {
    // Check localStorage for existing auth data
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("access_token");
    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser) as User;
      console.log("Parsed user from localStorage:", parsedUser);
      setUser(parsedUser);
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Define public routes
    const publicRoutes = ["/", "/login", "/register"];
    
    // Only redirect if we're not loading and user is not authenticated
    if (!loading && !user && !publicRoutes.includes(pathname)) {
      console.log("Redirecting to login - no user found");
      router.replace("/login");
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
            
      setToken(session.access_token);
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("access_token", session.access_token);

      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearAuth = (): void => {
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    setUser(null);
    setToken(null);
  };

  const logout = async (): Promise<void> => {
    try {
      console.log("Logging out user...");
      
      // Clear auth data from localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("access_token");
      
      // Update state immediately
      setUser(null);
      setToken(null);
      
      console.log("Auth state cleared, redirecting to login");
      
      // Use router.replace to prevent back button issues
      router.replace("/login");
      
      // Force a small delay to ensure state updates propagate
      setTimeout(() => {
        // Double-check if we're still on a protected route
        const currentPath = window.location.pathname;
        const publicRoutes = ["/", "/login", "/register"];
        if (!publicRoutes.includes(currentPath)) {
          console.log("Still on protected route, forcing redirect");
          window.location.href = "/login";
        }
      }, 100);
      
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback: clear everything and force navigation
      localStorage.clear();
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, logout, clearAuth, loading }}
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