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

interface SecurityEvent {
  _id: string;
  type: string;
  action: string;
  message: string;
  ip: string;
  userAgent: string;
  location: string;
  createdAt: string;
}

interface ConnectedDevice {
  _id: string;
  deviceName: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrentDevice: boolean;
  deviceType: string;
  trustLevel: string;
  loginCount: number;
}

interface DeviceStats {
  activeDevices: number;
  totalDevices: number;
  maxDevices: number;
  availableSlots: number;
  recentLogins: Array<{
    deviceName: string;
    lastActive: string;
    location: string;
  }>;
}

interface AuthState {
  user: IUser | null;
  tokens: Tokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  securityEvents: SecurityEvent[];
  connectedDevices: ConnectedDevice[];
  deviceStats: DeviceStats | null;
  securityLoading: boolean;
}

type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; payload: { user: IUser; tokens: Tokens | null } }
  | { type: "LOGIN_FAILURE" }
  | { type: "LOGOUT" }
  | { type: "UPDATE_USER"; payload: Partial<IUser> }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_SECURITY_EVENTS"; payload: SecurityEvent[] }
  | { type: "SET_CONNECTED_DEVICES"; payload: ConnectedDevice[] }
  | { type: "SET_DEVICE_STATS"; payload: DeviceStats }
  | { type: "SET_SECURITY_LOADING"; payload: boolean }
  | { type: "REMOVE_DEVICE"; payload: string };

const initialState: AuthState = {
  user: null,
  tokens: null,
  isLoading: true,
  isAuthenticated: false,
  securityEvents: [],
  connectedDevices: [],
  deviceStats: null,
  securityLoading: false,
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<IUser>) => void;
  manualLogin: (user: IUser) => void;
  // Security features
  fetchSecurityEvents: (page?: number, limit?: number) => Promise<void>;
  fetchConnectedDevices: () => Promise<void>;
  fetchDeviceStats: () => Promise<void>;
  logoutDevice: (deviceId: string) => Promise<void>;
  logoutAllOtherDevices: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  avatar?: File;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
      return {
        ...initialState,
        isLoading: false,
        securityEvents: [],
        connectedDevices: [],
        deviceStats: null,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_SECURITY_EVENTS":
      return { ...state, securityEvents: action.payload };
    case "SET_CONNECTED_DEVICES":
      return { ...state, connectedDevices: action.payload };
    case "SET_DEVICE_STATS":
      return { ...state, deviceStats: action.payload };
    case "SET_SECURITY_LOADING":
      return { ...state, securityLoading: action.payload };
    case "REMOVE_DEVICE":
      return {
        ...state,
        connectedDevices: state.connectedDevices.filter(
          (device) => device._id !== action.payload
        ),
      };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Generate or get device ID for tracking
  const getDeviceId = () => {
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      localStorage.setItem("deviceId", deviceId);
    }
    return deviceId;
  };

  // Enhanced API call helper with device tracking
  const apiCall = async (url: string, options: RequestInit = {}) => {
    const deviceId = getDeviceId();
    return fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "x-device-id": deviceId,
        ...options.headers,
      },
    });
  };

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

      try {
        // Delay to allow cookies to be registered by the browser
        await new Promise((res) => setTimeout(res, 500));
        const res = await apiCall(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/me`
        );

        if (!res.ok) throw new Error("Not authenticated");
        const data = await res.json();
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user: data.data.user, tokens: null },
        });
        localStorage.setItem("user", JSON.stringify(data.data.user));
      } catch {
        dispatch({ type: "LOGIN_FAILURE" });
      }
    };

    checkAuth();
  }, []);

  const manualLogin = (user: IUser) => {
    localStorage.setItem("user", JSON.stringify(user));
    dispatch({ type: "LOGIN_SUCCESS", payload: { user, tokens: null } });
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

  const register = async (data: RegisterData) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const res = await apiCall(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/register`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );

      if (!res.ok) throw new Error("Registration failed");
      const result = await res.json();
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
      console.error("Registration error:", error);
      toast.error("Registration failed. Please try again.");
      dispatch({ type: "LOGIN_FAILURE" });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiCall(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/logout`,
        { method: "POST" }
      );
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("deviceId");
      dispatch({ type: "LOGOUT" });
      router.push("/auth/login");
    }
  };

  const login = async (email: string, password: string) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const res = await apiCall(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/login`,
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
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

      // Fetch security data after successful login
      setTimeout(() => {
        fetchConnectedDevices();
        fetchDeviceStats();
      }, 1000);

      window.location.href = "/feed";
    } catch (err) {
      dispatch({ type: "LOGIN_FAILURE" });
      throw err;
    }
  };

  // Security feature methods
  const fetchSecurityEvents = async (page = 1, limit = 5) => {
    if (!state.isAuthenticated) return;

    dispatch({ type: "SET_SECURITY_LOADING", payload: true });
    try {
      const res = await apiCall(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/security/events?page=${page}&limit=${limit}`
      );

      if (res.ok) {
        const data = await res.json();
        dispatch({ type: "SET_SECURITY_EVENTS", payload: data.data.events });
      }
    } catch (error) {
      console.error("Failed to fetch security events:", error);
      toast.error("Failed to load security events");
    } finally {
      dispatch({ type: "SET_SECURITY_LOADING", payload: false });
    }
  };

  const fetchConnectedDevices = async () => {
    if (!state.isAuthenticated) return;

    try {
      const res = await apiCall(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/security/devices`
      );

      if (res.ok) {
        const data = await res.json();
        dispatch({ type: "SET_CONNECTED_DEVICES", payload: data.data.devices });
      }
    } catch (error) {
      console.error("Failed to fetch connected devices:", error);
    }
  };

  const fetchDeviceStats = async () => {
    if (!state.isAuthenticated) return;

    try {
      const res = await apiCall(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/security/device-stats`
      );

      if (res.ok) {
        const data = await res.json();
        dispatch({ type: "SET_DEVICE_STATS", payload: data.data });
      }
    } catch (error) {
      console.error("Failed to fetch device stats:", error);
    }
  };

  const logoutDevice = async (deviceId: string) => {
    try {
      const res = await apiCall(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/security/devices/${deviceId}/logout`,
        { method: "POST" }
      );

      if (res.ok) {
        const data = await res.json();
        dispatch({ type: "REMOVE_DEVICE", payload: deviceId });
        toast.success(`${data.data.deviceName} logged out successfully`);

        // Refresh device stats
        fetchDeviceStats();
      } else {
        throw new Error("Failed to logout device");
      }
    } catch (error) {
      console.error("Failed to logout device:", error);
      toast.error("Failed to logout device");
      throw error;
    }
  };

  const logoutAllOtherDevices = async () => {
    try {
      const res = await apiCall(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/security/devices/logout-all-others`,
        { method: "POST" }
      );

      if (res.ok) {
        const data = await res.json();
        toast.success(data.data.message);

        // Refresh connected devices and stats
        fetchConnectedDevices();
        fetchDeviceStats();
      } else {
        throw new Error("Failed to logout other devices");
      }
    } catch (error) {
      console.error("Failed to logout other devices:", error);
      toast.error("Failed to logout other devices");
      throw error;
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
        fetchSecurityEvents,
        fetchConnectedDevices,
        fetchDeviceStats,
        logoutDevice,
        logoutAllOtherDevices,
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
