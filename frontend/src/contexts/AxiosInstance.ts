import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000/api/",
    headers: { "Content-Type": "application/json" },
});

const TOKEN_KEY = "access";
const REFRESH_KEY = "refresh";


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
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem("user");
            // window.location.href = "/";
        }
        return Promise.reject(error);
    }
);

export default api;
