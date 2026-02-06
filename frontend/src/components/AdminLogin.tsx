"use client";
import { useState, FormEvent } from "react";
import { useAdmin } from "@/utils/adminContext";
import { Shield, Loader2, AlertCircle, Lock, User } from "lucide-react";

export default function AdminLogin() {
    const { login, isAuthenticated } = useAdmin();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await login(username, password);
            // Success - context will update isAuthenticated
        } catch (err: any) {
            setError(err.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (isAuthenticated) {
        return null; // Don't show login form if already authenticated
    }

    return (
        <div className="max-w-md mx-auto mt-12">
            <div className="glass-card p-8 space-y-6">
                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="flex justify-center">
                        <div className="p-4 rounded-full bg-gradient-primary shadow-lg shadow-primary-500/30">
                            <Shield size={32} className="text-white" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white">Admin Login</h2>
                    <p className="text-gray-400 text-sm">
                        Sign in to issue and manage certificates
                    </p>
                </div>

                {/* Error message */}
                {error && (
                    <div className="glass-card p-4 flex items-center gap-3 border-red-500/20 bg-red-500/[.04]">
                        <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
                        <p className="text-red-300 text-sm">{error}</p>
                    </div>
                )}

                {/* Login form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Username */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Username
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User size={18} className="text-gray-500" />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username"
                                required
                                className="input-field pl-10"
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock size={18} className="text-gray-500" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                required
                                className="input-field pl-10"
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            <>
                                <Shield size={18} />
                                Sign In
                            </>
                        )}
                    </button>
                </form>

                {/* Info */}

            </div>
        </div>
    );
}
