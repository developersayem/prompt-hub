"use client";

import { IUser } from "@/types/users.type";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useReducer, useEffect } from "react";

interface Tokens {
  accessToken?: string;
  refreshToken?: string;
}

interface LoginResponse {
  data: {
    user: IUser;
    requiresTwoFactor?: boolean;
    accessToken?: string;
    refreshToken?: string;
  };
  message: string;
}

interface AuthState {
  user: IUser | null;
  tokens: Tokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; payload: { user: IUser; tokens: Tokens | null } }
  | { type: "LOGIN_FAILURE" }
  | { type: "LOGOUT" }
  | { type: "UPDATE_USER"; payload: Partial<IUser> }
  | { type: "SET_LOADING"; payload: boolean };

const initialState: AuthState = {
  user: null,
  tokens: null,
  isLoading: true,
  isAuthenticated: false,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, isLoading: true };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isLoading: false,
        isAuthenticated: true,
      };
    case "LOGIN_FAILURE":
      return { ...state, isLoading: false, isAuthenticated: false };
    case "LOGOUT":
      return { ...initialState, isLoading: false };
    case "UPDATE_USER":
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<IUser>) => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  avatar?: File;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  // 👇 Initial user load
  useEffect(() => {
    const timer = setTimeout(() => {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          dispatch({
            type: "LOGIN_SUCCESS",
            payload: { user, tokens: null },
          });
        } catch {
          localStorage.removeItem("user");
          dispatch({ type: "LOGIN_FAILURE" });
        }
      } else {
        dispatch({ type: "LOGIN_FAILURE" });
      }
    }, 100); // slight delay to ensure localStorage availability

    return () => clearTimeout(timer);
  }, []);

  // 👇 Login function
  const login = async (email: string, password: string) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          credentials: "include",
        }
      );

      const contentType = res.headers.get("content-type");
      let data: LoginResponse | null = null;

      if (contentType && contentType.includes("application/json")) {
        data = (await res.json()) as LoginResponse;
      } else {
        throw new Error(
          `Server responded with non-JSON data and status ${res.status}`
        );
      }

      if (!res.ok) {
        throw new Error(data?.message || "Login failed");
      }

      const requiresTwoFactor = data.data.requiresTwoFactor;
      if (requiresTwoFactor) {
        router.push(`/auth/verify-2fa?email=${data.data.user.email}`);
        return;
      }

      const user = data.data.user;
      localStorage.setItem("user", JSON.stringify(user));
      dispatch({ type: "LOGIN_SUCCESS", payload: { user, tokens: null } });

      // ✅ FIX: Add delay before redirect
      await new Promise((resolve) => setTimeout(resolve, 200));
      router.push("/feed");
    } catch (err) {
      dispatch({ type: "LOGIN_FAILURE" });
      throw err;
    }
  };

  // 👇 Register function
  const register = async (data: RegisterData) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/register`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Registration failed");

      const result = await res.json();
      const user = result.data.user;

      localStorage.setItem("user", JSON.stringify(user));
      dispatch({ type: "LOGIN_SUCCESS", payload: { user, tokens: null } });
      await new Promise((resolve) => setTimeout(resolve, 200));
      router.push("/feed");
    } catch (err) {
      dispatch({ type: "LOGIN_FAILURE" });
      throw err;
    }
  };

  // 👇 Logout function
  const logout = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      localStorage.removeItem("user");
      dispatch({ type: "LOGOUT" });
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // 👇 Update user info
  const updateUser = (data: Partial<IUser>) => {
    const current = state.user;
    if (!current) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser) as IUser;
        const updatedUser = { ...parsed, ...data };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user: updatedUser, tokens: null },
        });
      }
    } else {
      const updatedUser = { ...current, ...data };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      dispatch({ type: "UPDATE_USER", payload: data });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
