import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";

type Tokens = {
    access: string | null;
    refresh: string | null;
};

type AuthContextType = {
    tokens: Tokens;
    isAuthenticated: boolean;
    login: (access: string, refresh: string) => void;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "access";
const REFRESH_KEY = "refresh";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [tokens, setTokens] = useState<Tokens>({ access: null, refresh: null });
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        const access = localStorage.getItem(TOKEN_KEY);
        const refresh = localStorage.getItem(REFRESH_KEY);
        setTokens({ access, refresh });
        setHydrated(true);
    }, []);

    const login = (access: string, refresh: string) => {
        setTokens({ access, refresh });
        localStorage.setItem(TOKEN_KEY, access);
        localStorage.setItem(REFRESH_KEY, refresh);
    };

    const logout = () => {
        setTokens({ access: null, refresh: null });
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
    };

    const isAuthenticated = !!tokens.access;

    if (!hydrated) return null;

    return (
        <AuthContext.Provider value={{ tokens, isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return ctx;
}
