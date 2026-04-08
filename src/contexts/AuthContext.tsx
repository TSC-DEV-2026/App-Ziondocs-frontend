import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import { api, clearAccessToken, friendlyErrorMessage, persistAccessTokenFromResponse } from "@/lib/api";
import { clearAuthLocalState, getItem, removeItem, setItem, StorageKeys } from "@/lib/storage";
import type { LoginPayload, User } from "@/types/auth";

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingIn: boolean;
  mustChangePassword: boolean;
  mustValidateInternalToken: boolean;
  internalTokenValidated: boolean;
  internalTokenBlockedInSession: boolean;
  internalTokenPromptedInSession: boolean;
  loginPassword: string | null;
  beginLogin: () => void;
  endLogin: () => void;
  login: (payload: LoginPayload) => Promise<User | null>;
  refreshUser: () => Promise<User | null>;
  logout: () => Promise<void>;
  setInternalTokenValidated: (v: boolean) => Promise<void>;
  setInternalTokenBlockedInSession: (v: boolean) => Promise<void>;
  setInternalTokenPromptedInSession: (v: boolean) => Promise<void>;
  clearInternalTokenSession: () => Promise<void>;
  setLoginPassword: (value: string) => void;
  clearLoginPassword: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function readBool(key: string) {
  return (await getItem(key)) === "true";
}

function normalizeUser(data: User): User {
  return {
    ...data,
    interno: data?.interno === true,
    senha_trocada: typeof data?.senha_trocada === "boolean" ? data.senha_trocada : null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [internalTokenValidated, setInternalTokenValidatedState] = useState(false);
  const [internalTokenBlockedInSession, setInternalTokenBlockedInSessionState] = useState(false);
  const [internalTokenPromptedInSession, setInternalTokenPromptedInSessionState] = useState(false);
  const loginPasswordRef = useRef<string | null>(null);
  const inflightRef = useRef<Promise<User | null> | null>(null);

  const setLoginPassword = useCallback((value: string) => {
    loginPasswordRef.current = value;
  }, []);

  const clearLoginPassword = useCallback(() => {
    loginPasswordRef.current = null;
  }, []);

  const clearInternalTokenSession = useCallback(async () => {
    setInternalTokenValidatedState(false);
    setInternalTokenBlockedInSessionState(false);
    setInternalTokenPromptedInSessionState(false);

    await Promise.all([
      removeItem(StorageKeys.internalTokenValidated),
      removeItem(StorageKeys.internalTokenBlocked),
      removeItem(StorageKeys.internalTokenPrompted)
    ]);
  }, []);

  const setInternalTokenValidated = useCallback(async (v: boolean) => {
    setInternalTokenValidatedState(v);
    await setItem(StorageKeys.internalTokenValidated, v ? "true" : "false");
  }, []);

  const setInternalTokenBlockedInSession = useCallback(async (v: boolean) => {
    setInternalTokenBlockedInSessionState(v);
    await setItem(StorageKeys.internalTokenBlocked, v ? "true" : "false");
  }, []);

  const setInternalTokenPromptedInSession = useCallback(async (v: boolean) => {
    setInternalTokenPromptedInSessionState(v);
    await setItem(StorageKeys.internalTokenPrompted, v ? "true" : "false");
  }, []);

  const fetchMe = useCallback(async (force = false) => {
    if (!force && inflightRef.current) {
      return inflightRef.current;
    }

    const promise = (async () => {
      try {
        const res = await api.get<User>("/user/me");
        const normalized = normalizeUser(res.data);
        setUser(normalized);
        setIsAuthenticated(true);
        return normalized;
      } catch {
        setUser(null);
        setIsAuthenticated(false);
        return null;
      } finally {
        inflightRef.current = null;
      }
    })();

    inflightRef.current = promise;
    return promise;
  }, []);

  const refreshUser = useCallback(async () => {
    return await fetchMe(true);
  }, [fetchMe]);

  const login = useCallback(async (payload: LoginPayload) => {
    setIsLoggingIn(true);
    setLoginPassword(payload.senha);

    try {
      const res = await api.post("/user/login-mobile", payload);
      await persistAccessTokenFromResponse(res.data);
      const me = await fetchMe(true);
      return me;
    } finally {
      setIsLoggingIn(false);
    }
  }, [fetchMe, setLoginPassword]);

  const logout = useCallback(async () => {
    try {
      await api.post("/user/logout");
    } catch {
      // ignore
    } finally {
      clearLoginPassword();
      setUser(null);
      setIsAuthenticated(false);
      await clearAccessToken();
      await clearAuthLocalState();
      router.replace("/login");
    }
  }, [clearLoginPassword]);

  const beginLogin = useCallback(() => {
    setIsLoggingIn(true);
  }, []);

  const endLogin = useCallback(() => {
    setIsLoggingIn(false);
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setInternalTokenValidatedState(await readBool(StorageKeys.internalTokenValidated));
      setInternalTokenBlockedInSessionState(await readBool(StorageKeys.internalTokenBlocked));
      setInternalTokenPromptedInSessionState(await readBool(StorageKeys.internalTokenPrompted));
      await fetchMe(true);
      setIsLoading(false);
    })();
  }, [fetchMe]);

  const mustChangePassword = !!isAuthenticated && user?.senha_trocada !== true;

  const mustValidateInternalToken =
    !!isAuthenticated &&
    !mustChangePassword &&
    user?.interno === true &&
    !internalTokenBlockedInSession &&
    !internalTokenValidated;

  const value = useMemo<AuthContextType>(() => ({
    user,
    isAuthenticated,
    isLoading,
    isLoggingIn,
    mustChangePassword,
    mustValidateInternalToken,
    internalTokenValidated,
    internalTokenBlockedInSession,
    internalTokenPromptedInSession,
    loginPassword: loginPasswordRef.current,
    beginLogin,
    endLogin,
    login,
    refreshUser,
    logout,
    setInternalTokenValidated,
    setInternalTokenBlockedInSession,
    setInternalTokenPromptedInSession,
    clearInternalTokenSession,
    setLoginPassword,
    clearLoginPassword
  }), [
    user,
    isAuthenticated,
    isLoading,
    isLoggingIn,
    mustChangePassword,
    mustValidateInternalToken,
    internalTokenValidated,
    internalTokenBlockedInSession,
    internalTokenPromptedInSession,
    beginLogin,
    endLogin,
    login,
    refreshUser,
    logout,
    setInternalTokenValidated,
    setInternalTokenBlockedInSession,
    setInternalTokenPromptedInSession,
    clearInternalTokenSession,
    setLoginPassword,
    clearLoginPassword
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export function authGuard(requireAuth = true) {
  return async (ctx: { isAuthenticated: boolean; isLoading: boolean }) => {
    if (ctx.isLoading) return null;
    if (requireAuth && !ctx.isAuthenticated) {
      router.replace("/login");
      return null;
    }
    return null;
  };
}

export function errorMessage(error: unknown, fallback?: string) {
  return friendlyErrorMessage(error, fallback);
}
