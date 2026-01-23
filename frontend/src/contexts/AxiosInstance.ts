import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000/api/",
    headers: { "Content-Type": "application/json" },
});

// Dołącz token z localStorage (simple, wystarczające dla SPA)
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("jwt_token");
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
            localStorage.removeItem("jwt_token");
            localStorage.removeItem("user");
            window.location.href = "/";
        }
        return Promise.reject(error);
    }
);

export default api;
