"use client";

import { IUser } from "@/types/users.type";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useReducer, useEffect } from "react";

interface Tokens {
  accessToken?: string; // Optional because tokens are stored in cookies
  refreshToken?: string;
}

interface LoginResponse {
  data: {
    user: IUser;
    accessToken?: string;
    refreshToken?: string;
  };
  message: string;
}

interface AuthState {
  user: IUser | null;
  tokens: Tokens | null; // We won't store tokens here, but keep for typing
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
        tokens: action.payload.tokens, // Will be null or undefined
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

  useEffect(() => {
    // Load user from localStorage (tokens are in cookies, so no localStorage for tokens)
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: {
            user,
            tokens: null, // tokens stored in cookies only
          },
        });
      } catch {
        localStorage.removeItem("user");
      }
    }
    dispatch({ type: "SET_LOADING", payload: false });
  }, []);

  //User login function to handle user login
  // It accepts email and password, sends a POST request to the backend,
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

      // Check if response content-type is JSON
      const contentType = res.headers.get("content-type");
      let data: LoginResponse | null = null;

      if (contentType && contentType.includes("application/json")) {
        data = (await res.json()) as LoginResponse;
      } else {
        // If not JSON, try to get text to log
        const text = await res.text();
        console.error("Response is not JSON:", text);
        throw new Error(
          `Server responded with non-JSON data and status ${res.status}`
        );
      }

      if (!res.ok) {
        const error = new Error(data.message || "Login failed") as Error & {
          status?: number;
        };
        error.status = res.status;
        throw error;
      }

      const user = data.data.user;

      localStorage.setItem("user", JSON.stringify(user));
      dispatch({ type: "LOGIN_SUCCESS", payload: { user, tokens: null } });
    } catch (err) {
      dispatch({ type: "LOGIN_FAILURE" });
      throw err;
    }
  };

  // User register function to handle user registration
  // It accepts a RegisterData object which includes name, email, password, and an optional
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
          credentials: "include", // to accept cookies
        }
      );

      if (!res.ok) throw new Error("Registration failed");
      const result = await res.json();

      const user = result.data.user;

      localStorage.setItem("user", JSON.stringify(user));
      router.push("/feed");
      dispatch({ type: "LOGIN_SUCCESS", payload: { user, tokens: null } });
    } catch (err) {
      dispatch({ type: "LOGIN_FAILURE" });
      throw err;
    }
  };

  // User logout Function
  const logout = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/logout`,
        {
          method: "POST",
          credentials: "include", // important to send cookies
        }
      );

      localStorage.removeItem("user");

      dispatch({ type: "LOGOUT" });

      // Optional: redirect user to login page
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  const updateUser = (data: Partial<IUser>) => {
    if (!state.user) return;

    const updatedUser = { ...state.user, ...data };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    dispatch({ type: "UPDATE_USER", payload: data });
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
