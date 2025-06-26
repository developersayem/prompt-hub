"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";

export interface ISocialLinks {
  facebook?: string;
  instagram?: string;
  github?: string;
  linkedIn?: string;
  x?: string;
  portfolio?: string;
}
export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  socialLinks?: ISocialLinks;
  credits: number;
  isGoogleAuthenticated?: boolean;
  isCertified?: boolean;
  prompt: [];
  purchasedPrompts: [];
  bookmarks: [];
  refreshToken: string;
  createdAt: string;
  updatedAt: string;
}

interface Tokens {
  accessToken?: string; // Optional because tokens are stored in cookies
  refreshToken?: string;
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

  // login function to handle user login
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
          credentials: "include", // important to include cookies in request
        }
      );

      if (!res.ok) throw new Error("Login failed");
      const data = await res.json();

      // Only save user data; tokens are sent as httpOnly cookies by backend
      const user = data.data.user;

      localStorage.setItem("user", JSON.stringify(user));

      dispatch({ type: "LOGIN_SUCCESS", payload: { user, tokens: null } });
    } catch (err) {
      dispatch({ type: "LOGIN_FAILURE" });
      throw err;
    }
  };

  // register function to handle user registration
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

      dispatch({ type: "LOGIN_SUCCESS", payload: { user, tokens: null } });
    } catch (err) {
      dispatch({ type: "LOGIN_FAILURE" });
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    // clear cookies
    const date = new Date(Date.now() - 1000);
    document.cookie = `accessToken=; expires=${date.toUTCString()}; path=/;`;
    document.cookie = `refreshToken=; expires=${date.toUTCString()}; path=/;`;
    dispatch({ type: "LOGOUT" });
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
