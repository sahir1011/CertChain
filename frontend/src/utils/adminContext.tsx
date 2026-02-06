"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface AdminContextType {
    isAuthenticated: boolean;
    username: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    verifySession: () => Promise<void>;
    isLoading: boolean;
}

const AdminContext = createContext<AdminContextType>({
    isAuthenticated: false,
    username: null,
    login: async () => { },
    logout: async () => { },
    verifySession: async () => { },
    isLoading: true,
});

const API_BASE = "http://localhost:3001/api";

export function AdminProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const verifySession = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/auth/verify`, {
                method: "GET",
                credentials: "include", // Include cookies
            });

            if (response.ok) {
                const data = await response.json();
                if (data.authenticated) {
                    setIsAuthenticated(true);
                    setUsername(data.user.username);
                } else {
                    setIsAuthenticated(false);
                    setUsername(null);
                }
            } else {
                setIsAuthenticated(false);
                setUsername(null);
            }
        } catch (error) {
            console.error("Session verification failed:", error);
            setIsAuthenticated(false);
            setUsername(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        verifySession();
    }, [verifySession]);

    const login = async (username: string, password: string) => {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // Include cookies
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Login failed");
        }

        const data = await response.json();
        setIsAuthenticated(true);
        setUsername(data.user.username);
    };

    const logout = async () => {
        try {
            await fetch(`${API_BASE}/auth/logout`, {
                method: "POST",
                credentials: "include", // Include cookies
            });
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setIsAuthenticated(false);
            setUsername(null);
        }
    };

    return (
        <AdminContext.Provider value={{ isAuthenticated, username, login, logout, verifySession, isLoading }}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    return useContext(AdminContext);
}
