import axios, { AxiosError } from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig} from "axios";

const API_BASE_URL = "http://localhost:8000/api/";
const TOKEN_ACCESS_KEY = "access";
const TOKEN_REFRESH_KEY = "refresh";
const AUTH_HEADER = "Authorization";
const BEARER_PREFIX = "Bearer ";
const REFRESH_ENDPOINT = 'auth/refresh/';

interface AuthConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

interface RefreshResponse {
    access: string;
}

const authStorage = {
    getAccess: (): string | null => localStorage.getItem(TOKEN_ACCESS_KEY),
    getRefresh: (): string | null => localStorage.getItem(TOKEN_REFRESH_KEY),
    setAccess: (token: string): void => localStorage.setItem(TOKEN_ACCESS_KEY, token),
    clear: (): void => {
        localStorage.removeItem(TOKEN_ACCESS_KEY);
        localStorage.removeItem(TOKEN_REFRESH_KEY);
    },
};

const tokenRefreshService = {
    async refresh(client: AxiosInstance): Promise<string> {
        const refreshToken = authStorage.getRefresh();
        if (!refreshToken) throw new Error("No refresh token available");

        const { data } = await client.post<RefreshResponse>(REFRESH_ENDPOINT, { refresh: refreshToken });
        return data.access;
    },
};

const setAuthHeader = (config: InternalAxiosRequestConfig, token: string): InternalAxiosRequestConfig => {
    config.headers ??= {};
    config.headers[AUTH_HEADER] = `${BEARER_PREFIX}${token}`;
    return config;
};

const createAuthInterceptors = (client: AxiosInstance) => {
    let isRefreshing = false;
    let pendingRequests: Array<(token: string | null) => void> = [];

    const requestInterceptor = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
        const token = authStorage.getAccess();
        if (token) setAuthHeader(config, token);
        return config;
    };

    const responseInterceptor = async (error: AxiosError): Promise<any> => {
        const config = error.config as AuthConfig;
        if (!error.response?.status || error.response.status !== 401 || !config) {
            return Promise.reject(error);
        }

        if (config._retry) {
            authStorage.clear();
            window.location.href = "/login";
            return Promise.reject(error);
        }

        config._retry = true;

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                pendingRequests.push((newToken) => {
                    if (!newToken) return reject(error);
                    setAuthHeader(config, newToken);
                    resolve(client(config));
                });
            });
        }

        isRefreshing = true;

        try {
            const newToken = await tokenRefreshService.refresh(client);
            authStorage.setAccess(newToken);
            pendingRequests.forEach((cb) => cb(newToken));
            pendingRequests = [];
            setAuthHeader(config, newToken);
            return client(config);
        } catch (refreshError) {
            pendingRequests.forEach((cb) => cb(null));
            pendingRequests = [];
            authStorage.clear();
            window.location.href = "/login";
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    };

    return { requestInterceptor, responseInterceptor };
};

const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
});

const { requestInterceptor, responseInterceptor } = createAuthInterceptors(api);

api.interceptors.request.use(requestInterceptor);
api.interceptors.response.use((response) => response, responseInterceptor);

export default api;
