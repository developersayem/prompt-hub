"use client";

import { IUser } from "@/types/users.type";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useReducer, useEffect } from "react";
import { toast } from "sonner";

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
      return {
        ...state,
        user: null,
        tokens: null,
        isLoading: false,
        isAuthenticated: false,
      };
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
  manualLogin: (user: IUser) => void; // add this
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
  const router = useRouter();
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On app start, check session by calling /me endpoint
  useEffect(() => {
    const checkAuth = async () => {
      const localUser = localStorage.getItem("user");
      if (localUser) {
        try {
          const parsedUser = JSON.parse(localUser);
          dispatch({
            type: "LOGIN_SUCCESS",
            payload: { user: parsedUser, tokens: null },
          });
        } catch {
          localStorage.removeItem("user");
        }
      }

      // Delay to allow cookies to be registered by the browser
      await new Promise((res) => setTimeout(res, 500));

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/me`,
          {
            credentials: "include",
          }
        );
        if (!res.ok) throw new Error("Not authenticated");

        const data = await res.json();
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user: data.data.user, tokens: null },
        });

        localStorage.setItem("user", JSON.stringify(data.data.user));
      } catch {
        localStorage.removeItem("user");
        dispatch({ type: "LOGIN_FAILURE" });
      }
    };

    checkAuth();
  }, []);

  const manualLogin = (user: IUser) => {
    localStorage.setItem("user", JSON.stringify(user));
    dispatch({ type: "LOGIN_SUCCESS", payload: { user, tokens: null } });
  };

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
        data = await res.json();
      } else {
        throw {
          status: res.status,
          message: `Unexpected response format. Status: ${res.status}`,
        };
      }

      if (!res.ok) {
        throw {
          status: res.status,
          message: data?.message || "Login failed",
        };
      }

      if (data && data.data.requiresTwoFactor) {
        window.location.href = `/auth/verify-2fa?email=${data.data.user.email}`;
        return;
      }

      if (!data) {
        throw new Error("Login response is null");
      }

      const user = data.data.user;
      localStorage.setItem("user", JSON.stringify(user));
      dispatch({ type: "LOGIN_SUCCESS", payload: { user, tokens: null } });

      window.location.href = "/feed";
    } catch (err) {
      dispatch({ type: "LOGIN_FAILURE" });
      throw err;
    }
  };

  const register = async (data: RegisterData) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" }, // Important!
          body: JSON.stringify(data),
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Registration failed");

      const result = await res.json();

      // FIX: use `result.data.email` directly since `user` is not returned
      const userEmail = result.data?.email;

      toast.success("Registration successful!");

      if (userEmail) {
        window.location.href = `/auth/verify?step=code&email=${encodeURIComponent(
          userEmail
        )}`;
      } else {
        window.location.href = "/auth/verify";
      }
    } catch (error) {
      dispatch({ type: "LOGIN_FAILURE" });
      console.error("Registration error:", error);
      toast.error("Registration failed. Please try again.");
      throw error;
    }
  };

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
        manualLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
