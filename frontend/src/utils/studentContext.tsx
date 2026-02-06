"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface StudentContextType {
    isAuthenticated: boolean;
    username: string | null;
    studentId: string | null;
    register: (username: string, password: string, studentId: string) => Promise<void>;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    verifySession: () => Promise<void>;
    isLoading: boolean;
}

const StudentContext = createContext<StudentContextType>({
    isAuthenticated: false,
    username: null,
    studentId: null,
    register: async () => { },
    login: async () => { },
    logout: async () => { },
    verifySession: async () => { },
    isLoading: true,
});

const API_BASE = "http://localhost:3001/api";

export function StudentProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState<string | null>(null);
    const [studentId, setStudentId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const verifySession = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/auth/student/verify`, {
                method: "GET",
                credentials: "include", // Include cookies
            });

            if (response.ok) {
                const data = await response.json();
                if (data.authenticated) {
                    setIsAuthenticated(true);
                    setUsername(data.user.username);
                    setStudentId(data.user.studentId);
                } else {
                    setIsAuthenticated(false);
                    setUsername(null);
                    setStudentId(null);
                }
            } else {
                setIsAuthenticated(false);
                setUsername(null);
                setStudentId(null);
            }
        } catch (error) {
            console.error("Session verification failed:", error);
            setIsAuthenticated(false);
            setUsername(null);
            setStudentId(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        verifySession();
    }, [verifySession]);

    const register = async (username: string, password: string, studentId: string) => {
        const response = await fetch(`${API_BASE}/auth/student/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // Include cookies
            body: JSON.stringify({ username, password, studentId }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Registration failed");
        }

        const data = await response.json();
        // After successful registration, log in automatically
        await login(username, password);
    };

    const login = async (username: string, password: string) => {
        const response = await fetch(`${API_BASE}/auth/student/login`, {
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
        setStudentId(data.user.studentId);
    };

    const logout = async () => {
        try {
            await fetch(`${API_BASE}/auth/student/logout`, {
                method: "POST",
                credentials: "include", // Include cookies
            });
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setIsAuthenticated(false);
            setUsername(null);
            setStudentId(null);
        }
    };

    return (
        <StudentContext.Provider value={{ isAuthenticated, username, studentId, register, login, logout, verifySession, isLoading }}>
            {children}
        </StudentContext.Provider>
    );
}

export function useStudent() {
    return useContext(StudentContext);
}
