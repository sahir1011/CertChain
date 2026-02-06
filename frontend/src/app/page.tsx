"use client";
import { useState } from "react";
import Navbar, { type Tab } from "@/components/Navbar";
import Dashboard from "@/components/Dashboard";
import IssueCertificate from "@/components/IssueCertificate";
import VerifyCertificate from "@/components/VerifyCertificate";
import History from "@/components/History";
import Background from "@/components/Background";
import AdminLogin from "@/components/AdminLogin";
import StudentLogin from "@/components/StudentLogin";
import StudentRegister from "@/components/StudentRegister";
import StudentDashboard from "@/components/StudentDashboard";
import { WalletProvider } from "@/utils/walletContext";
import { AdminProvider, useAdmin } from "@/utils/adminContext";
import { StudentProvider, useStudent } from "@/utils/studentContext";

function HomeContent() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [studentView, setStudentView] = useState<"login" | "register">("login");
  const { isAuthenticated: isAdminAuthenticated } = useAdmin();
  const { isAuthenticated: isStudentAuthenticated } = useStudent();

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <Background />
      <div className="relative z-10">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === "dashboard" && <Dashboard setActiveTab={setActiveTab} />}
          {activeTab === "verify" && <VerifyCertificate />}
          {activeTab === "history" && <History />}
          {activeTab === "admin" && (
            isAdminAuthenticated ? <IssueCertificate /> : <AdminLogin />
          )}
          {activeTab === "student" && (
            isStudentAuthenticated ? (
              <StudentDashboard />
            ) : (
              studentView === "login" ? (
                <StudentLogin onSwitchToRegister={() => setStudentView("register")} />
              ) : (
                <StudentRegister onSwitchToLogin={() => setStudentView("login")} />
              )
            )
          )}
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <WalletProvider>
      <AdminProvider>
        <StudentProvider>
          <HomeContent />
        </StudentProvider>
      </AdminProvider>
    </WalletProvider>
  );
}
