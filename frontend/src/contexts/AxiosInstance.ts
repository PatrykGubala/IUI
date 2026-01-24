import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000/api/",
    headers: { "Content-Type": "application/json" },
});

const TOKEN_KEY = "access";
const REFRESH_KEY = "refresh";

let isRefreshing = false;
let pendingRequests: ((token: string | null) => void)[] = [];

api.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as (InternalAxiosRequestConfig & {
            _retry?: boolean;
        });

        if (!error.response || error.response.status !== 401) {
            return Promise.reject(error);
        }

        if (originalRequest._retry) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_KEY);
            window.location.href = "/login";
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                pendingRequests.push((newToken) => {
                    if (!newToken) {
                        reject(error);
                        return;
                    }
                    originalRequest.headers = originalRequest.headers ?? {};
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    resolve(api(originalRequest));
                });
            });
        }

        isRefreshing = true;
        const refresh = localStorage.getItem(REFRESH_KEY);

        if (!refresh) {
            isRefreshing = false;
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_KEY);
            window.location.href = "/login";
            return Promise.reject(error);
        }

        try {
            const res = await axios.post("http://localhost:8000/api/token/refresh/", {
                refresh,
            });

            const newAccess = (res.data as { access: string }).access;

            localStorage.setItem(TOKEN_KEY, newAccess);
            api.defaults.headers.Authorization = `Bearer ${newAccess}`;

            pendingRequests.forEach((cb) => cb(newAccess));
            pendingRequests = [];
            isRefreshing = false;

            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            return api(originalRequest);
        } catch (refreshError) {
            isRefreshing = false;
            pendingRequests.forEach((cb) => cb(null));
            pendingRequests = [];
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_KEY);
            window.location.href = "/login";
            return Promise.reject(refreshError);
        }
    }
);

export default api;
