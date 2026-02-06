"use client";
import { useState, useEffect } from "react";
import { FileText, ExternalLink, CheckCircle, XCircle, Loader2, Award, Calendar, Building, GraduationCap, LogOut } from "lucide-react";
import { useStudent } from "@/utils/studentContext";
import axios from "axios";

const BASE_URL = process.env.BACKEND_URL || "http://localhost:3001";

interface Certificate {
    certificateHash: string;
    studentName: string;
    studentId: string;
    courseName: string;
    institutionName: string;
    issuanceDate: string;
    expiryDate?: string;
    grade?: string;
    isValid: boolean;
    issuerAddress: string;
    txHash: string;
    blockNumber: number;
    timestamp: number;
}

export default function StudentDashboard() {
    const { studentId, logout } = useStudent();
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (studentId) {
            fetchCertificates();
        }
    }, [studentId]);

    const fetchCertificates = async () => {
        try {
            setLoading(true);
            if (!studentId) {
                setError("Student ID not found");
                return;
            }
            const response = await axios.get(`${BASE_URL}/api/certificates/student/${studentId}`, {
                withCredentials: true,
            });
            setCertificates(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch certificates");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">My Certificates</h1>
                        <p className="text-gray-300">
                            Welcome back, <span className="font-semibold text-purple-400">{studentId}</span>
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6 text-center">
                        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                        <p className="text-red-200">{error}</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && certificates.length === 0 && (
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-2">No Certificates Found</h3>
                        <p className="text-gray-300">
                            You don't have any certificates yet. Contact your institution if you believe this is an error.
                        </p>
                    </div>
                )}

                {/* Certificates Grid */}
                {!loading && !error && certificates.length > 0 && (
                    <div className="grid gap-6">
                        {certificates.map((cert) => (
                            <div
                                key={cert.certificateHash}
                                className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 hover:bg-white/15 transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                            <Award className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-white mb-1">{cert.courseName}</h3>
                                            <p className="text-gray-300">{cert.studentName}</p>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${cert.isValid
                                        ? "bg-emerald-500/20 border border-emerald-500/50"
                                        : "bg-red-500/20 border border-red-500/50"
                                        }`}>
                                        {cert.isValid ? (
                                            <>
                                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                                <span className="text-emerald-300 font-semibold text-sm">Valid</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-4 h-4 text-red-400" />
                                                <span className="text-red-300 font-semibold text-sm">Revoked</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Certificate Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <Building className="w-5 h-5 text-purple-400" />
                                        <div>
                                            <p className="text-xs text-gray-400">Institution</p>
                                            <p className="font-medium">{cert.institutionName}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-gray-300">
                                        <Calendar className="w-5 h-5 text-purple-400" />
                                        <div>
                                            <p className="text-xs text-gray-400">Issued On</p>
                                            <p className="font-medium">{new Date(cert.issuanceDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    {cert.grade && (
                                        <div className="flex items-center gap-3 text-gray-300">
                                            <GraduationCap className="w-5 h-5 text-purple-400" />
                                            <div>
                                                <p className="text-xs text-gray-400">Grade</p>
                                                <p className="font-medium">{cert.grade}</p>
                                            </div>
                                        </div>
                                    )}

                                    {cert.expiryDate && (
                                        <div className="flex items-center gap-3 text-gray-300">
                                            <Calendar className="w-5 h-5 text-purple-400" />
                                            <div>
                                                <p className="text-xs text-gray-400">Expires On</p>
                                                <p className="font-medium">{new Date(cert.expiryDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Certificate Hash */}
                                <div className="mb-4 p-3 bg-black/20 rounded-xl">
                                    <p className="text-xs text-gray-400 mb-1">Certificate Hash</p>
                                    <p className="text-sm text-gray-300 font-mono break-all">{cert.certificateHash}</p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <a
                                        href={`https://sepolia.etherscan.io/tx/${cert.txHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-xl text-purple-300 transition-all text-sm font-medium"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        View on Etherscan
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Summary */}
                {!loading && !error && certificates.length > 0 && (
                    <div className="mt-8 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                            <div>
                                <p className="text-3xl font-bold text-white mb-1">{certificates.length}</p>
                                <p className="text-gray-300">Total Certificates</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-emerald-400 mb-1">
                                    {certificates.filter(c => c.isValid).length}
                                </p>
                                <p className="text-gray-300">Valid</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-red-400 mb-1">
                                    {certificates.filter(c => !c.isValid).length}
                                </p>
                                <p className="text-gray-300">Revoked</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
