"use client";
import { useState, useEffect } from "react";
import { useWallet } from "@/utils/walletContext";
import { useAdmin } from "@/utils/adminContext";
import { useStudent } from "@/utils/studentContext";
import { Shield, Wallet, X, Menu, LogOut, UserCircle, GraduationCap } from "lucide-react";

export type Tab = "dashboard" | "admin" | "student" | "verify" | "history";

interface NavbarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "admin", label: "Admin" },
  { id: "student", label: "Student" },
  { id: "verify", label: "Verify" },
  { id: "history", label: "History" },

];

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const { account, connectWallet, disconnectWallet, isConnected } = useWallet();
  const { isAuthenticated: isAdminAuthenticated, username, logout: adminLogout } = useAdmin();
  const { isAuthenticated: isStudentAuthenticated, studentId, logout: studentLogout } = useStudent();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const shortAddr = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "";

  const handleAdminLogout = async () => {
    await adminLogout();
    if (activeTab === "admin") {
      setActiveTab("dashboard");
    }
  };

  const handleStudentLogout = async () => {
    await studentLogout();
    if (activeTab === "student") {
      setActiveTab("dashboard");
    }
  };

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-blockchain-dark/90 backdrop-blur-md border-b border-white/[.06]" : "bg-transparent"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-primary rounded-xl shadow-lg shadow-primary-500/30">
              <Shield size={22} className="text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gradient">CertChain</span>
              <p className="text-xs text-gray-500 -mt-0.5 tracking-wider uppercase">Blockchain Certificates</p>
            </div>
          </div>

          {/* Desktop tabs */}
          <div className="hidden md:flex items-center gap-1 bg-white/[.04] rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${activeTab === tab.id
                  ? "bg-primary-600 text-white shadow-md shadow-primary-600/30"
                  : "text-gray-400 hover:text-white hover:bg-white/[.06]"
                  }`}
              >
                {tab.label}
                {tab.id === "admin" && isAdminAuthenticated && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
                {tab.id === "student" && isStudentAuthenticated && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                )}
                {tab.id === "student" && isStudentAuthenticated && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Wallet button + admin/student status + mobile menu toggle */}
          <div className="flex items-center gap-3">
            {/* Admin status */}
            {isAdminAuthenticated && (
              <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                <UserCircle size={16} className="text-emerald-400" />
                <span className="text-emerald-400 text-sm font-medium">{username}</span>
                <button
                  onClick={handleAdminLogout}
                  className="ml-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                  title="Logout"
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}

            {/* Student status */}
            {isStudentAuthenticated && (
              <div className="hidden sm:flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-2">
                <GraduationCap size={16} className="text-purple-400" />
                <span className="text-purple-400 text-sm font-medium">{studentId}</span>
                <button
                  onClick={handleStudentLogout}
                  className="ml-1 p-1 hover:bg-purple-500/20 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut size={14} className="text-purple-400" />
                </button>
              </div>
            )}

            {/* Wallet */}
            {isConnected ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-blue-400 text-sm font-medium font-mono">{shortAddr}</span>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="btn-secondary !px-3 !py-2 text-sm text-red-400 hover:text-red-300 border-red-500/20 hover:border-red-500/40"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button onClick={connectWallet} className="btn-primary !px-4 !py-2 text-sm flex items-center gap-2">
                <Wallet size={16} />
                Connect Wallet
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden btn-secondary !px-3 !py-2"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/[.06] bg-blockchain-dark/95 backdrop-blur-md">
          <div className="px-4 py-3 flex flex-col gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setMenuOpen(false); }}
                className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                  ? "bg-primary-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/[.06]"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
