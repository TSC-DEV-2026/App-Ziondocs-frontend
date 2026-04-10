import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import Constants from "expo-constants";
import { router } from "expo-router";
import {
  clearAuthLocalState,
  getItem,
  removeItem,
  setItem,
  StorageKeys,
} from "@/lib/storage";

type ExpoExtra = {
  apiUrlProd?: string;
  apiUrlDev?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;
const explicitApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

const baseURL =
  explicitApiUrl ||
  (__DEV__
    ? extra.apiUrlDev || "http://localhost:8000"
    : extra.apiUrlProd || "https://rh.ziondocs.com.br");

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
  timeout: 30000,
});

async function forceLogoutRedirect() {
  await clearAuthLocalState();

  try {
    router.replace("/login");
  } catch {
    // ignore
  }
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getItem(StorageKeys.accessToken);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function shouldSkipRefresh(url?: string) {
  const value = (url ?? "").toLowerCase();
  return (
    value.includes("/user/refresh") ||
    value.includes("/user/refresh-mobile") ||
    value.includes("/user/login") ||
    value.includes("/user/login-mobile") ||
    value.includes("/user/logout")
  );
}

let refreshPromise: Promise<AxiosResponse<unknown>> | null = null;

async function runMobileRefresh() {
  const refreshToken = await getItem(StorageKeys.refreshToken);
  if (!refreshToken) {
    throw new Error("Refresh token ausente");
  }

  return api.post(
    "/user/refresh-mobile",
    {},
    {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    },
  );
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const status = error.response?.status;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (
      status === 401 &&
      !originalRequest._retry &&
      !shouldSkipRefresh(originalRequest.url)
    ) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = runMobileRefresh()
          .then(async (res) => {
            await persistAccessTokenFromResponse(res.data);
            return res;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      try {
        await refreshPromise;

        const token = await getItem(StorageKeys.accessToken);
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        await forceLogoutRedirect();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export async function persistAccessTokenFromResponse(data: unknown) {
  const accessToken =
    (data as any)?.access_token || (data as any)?.token || null;

  const refreshToken = (data as any)?.refresh_token || null;

  if (accessToken) {
    await setItem(StorageKeys.accessToken, String(accessToken));
  }

  if (refreshToken) {
    await setItem(StorageKeys.refreshToken, String(refreshToken));
  }
}

export async function clearAccessToken() {
  await Promise.all([
    removeItem(StorageKeys.accessToken),
    removeItem(StorageKeys.refreshToken),
  ]);
}

export function friendlyErrorMessage(
  error: unknown,
  fallback = "Ocorreu um erro.",
) {
  const err = error as any;
  const status = err?.response?.status as number | undefined;

  if (typeof status === "number") {
    switch (status) {
      case 400:
        return (
          err?.response?.data?.detail ||
          "A solicitação não pôde ser processada."
        );
      case 401:
        return "Credenciais inválidas ou sessão expirada. Faça login novamente.";
      case 403:
        return (
          err?.response?.data?.detail ||
          "Você não tem permissão para executar esta ação."
        );
      case 404:
        return err?.response?.data?.detail || "Nenhum registro foi encontrado.";
      case 413:
        return "O arquivo enviado é grande demais.";
      case 422:
        return "Os dados informados não passaram na validação.";
      case 429:
        return "Muitas tentativas. Aguarde e tente novamente.";
      case 500:
        return (
          err?.response?.data?.detail || "O servidor retornou erro interno."
        );
      case 502:
      case 503:
      case 504:
        return "O serviço está indisponível no momento.";
      default:
        break;
    }
  }

  if (err?.message === "Network Error") {
    return `Não foi possível conectar ao servidor (${baseURL}).`;
  }

  return err?.response?.data?.detail || err?.message || fallback;
}