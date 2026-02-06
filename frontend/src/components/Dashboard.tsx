"use client";
import { useState, useEffect } from "react";
import { Shield, FileText, Search, Clock, TrendingUp, AlertCircle, Link } from "lucide-react";
import { useWallet } from "@/utils/walletContext";
import { healthCheck, listCertificates } from "@/utils/api";
import type { HealthResponse, CertificateRecord } from "@/utils/api";

type Tab = "dashboard" | "admin" | "verify" | "history";

interface DashboardProps {
  setActiveTab: (tab: Tab) => void;
}

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}

export default function Dashboard({ setActiveTab }: DashboardProps) {
  const { isConnected, isCorrectNetwork } = useWallet();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [certs, setCerts] = useState<CertificateRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [h, c] = await Promise.all([healthCheck(), listCertificates()]);
        setHealth(h);
        setCerts(c);
      } catch { }
      setLoading(false);
    };
    fetch();
  }, []);

  const validCount = certs.filter((c) => c.isValid).length;
  const revokedCount = certs.filter((c) => !c.isValid).length;

  const stats: StatCard[] = [
    {
      title: "Total Certificates",
      value: loading ? "…" : certs.length,
      icon: <FileText size={22} />,
      color: "text-primary-400",
      sub: "issued on-chain",
    },
    {
      title: "Valid Certificates",
      value: loading ? "…" : validCount,
      icon: <Shield size={22} />,
      color: "text-emerald-400",
      sub: "currently active",
    },
    {
      title: "Revoked",
      value: loading ? "…" : revokedCount,
      icon: <AlertCircle size={22} />,
      color: "text-red-400",
      sub: "no longer valid",
    },
    {
      title: "Network Block",
      value: loading ? "…" : health?.blockNumber ?? "—",
      icon: <TrendingUp size={22} />,
      color: "text-purple-400",
      sub: "latest Sepolia block",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center pt-4 pb-2">
        <h1 className="text-4xl sm:text-5xl font-bold mb-3">
          <span className="text-gradient">CertChain</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Issue, verify, and manage student certificates secured by Ethereum Sepolia blockchain.
          Tamper-proof. Instant. Decentralized.
        </p>
      </div>

      {/* Network banner */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* wallet status */}
        {!isConnected ? (
          <div className="flex-1 glass-card p-4 flex items-center gap-3 border-amber-500/20 bg-amber-500/[.04]">
            <AlertCircle size={20} className="text-amber-400 flex-shrink-0" />
            <p className="text-amber-300 text-sm">Connect your MetaMask wallet to issue or revoke certificates.</p>
          </div>
        ) : !isCorrectNetwork ? (
          <div className="flex-1 glass-card p-4 flex items-center gap-3 border-red-500/20 bg-red-500/[.04]">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">Wrong network detected. Please switch to Sepolia.</p>
          </div>
        ) : (
          <div className="flex-1 glass-card p-4 flex items-center gap-3 border-emerald-500/20 bg-emerald-500/[.04]">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <p className="text-emerald-300 text-sm">
              Wallet connected · Sepolia Testnet · Contract: <span className="font-mono text-xs opacity-75">{health?.contractAddress ? `${health.contractAddress.slice(0, 8)}…` : "…"}</span>
            </p>
          </div>
        )}

        {/* Contract info */}
        <div className="glass-card p-4 flex items-center gap-3 min-w-[220px]">
          <Link size={20} className="text-primary-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Smart Contract</p>
            <p className="text-sm font-mono text-gray-300">{health?.contractAddress ? `${health.contractAddress.slice(0, 10)}…${health.contractAddress.slice(-4)}` : "Loading…"}</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.title} className="glass-card-hover p-5 group">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl bg-white/[.06] ${s.color} group-hover:bg-white/[.1] transition-colors`}>
                {s.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-sm font-medium text-gray-300 mt-0.5">{s.title}</p>
            <p className="text-xs text-gray-500 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveTab("admin")}
          className="glass-card-hover p-6 text-left group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-primary-500/10 text-primary-400 group-hover:bg-primary-500/20 transition-colors">
              <FileText size={24} />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white">Issue Certificate</h3>
          <p className="text-sm text-gray-400 mt-1">Create and store a new student certificate on the blockchain.</p>
        </button>

        <button
          onClick={() => setActiveTab("verify")}
          className="glass-card-hover p-6 text-left group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <Search size={24} />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white">Verify Certificate</h3>
          <p className="text-sm text-gray-400 mt-1">Validate a certificate hash against the blockchain record.</p>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className="glass-card-hover p-6 text-left group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
              <Clock size={24} />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white">Certificate History</h3>
          <p className="text-sm text-gray-400 mt-1">Browse all issued certificates and their on-chain status.</p>
        </button>
      </div>
    </div>
  );
}
