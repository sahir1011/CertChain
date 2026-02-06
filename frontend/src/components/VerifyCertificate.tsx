"use client";
import { useState, FormEvent } from "react";
import { Search, Loader2, CheckCircle, XCircle, ExternalLink, FileText } from "lucide-react";
import { Upload } from "lucide-react";
import jsQR from "jsqr";
import { verifyCertificate, getCertificateByStudent } from "@/utils/api";
import type { VerifyResponse, CertificateRecord } from "@/utils/api";

export default function VerifyCertificate() {
  const [hashInput, setHashInput] = useState("");
  const [studentInput, setStudentInput] = useState("");
  const [mode, setMode] = useState<"hash" | "student">("hash");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [studentResults, setStudentResults] = useState<CertificateRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleHashVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!hashInput.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await verifyCertificate(hashInput.trim());
      setResult(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Verification failed.");
    }
    setLoading(false);
  };

  const handleStudentSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!studentInput.trim()) return;
    setLoading(true);
    setStudentResults([]);
    setError(null);
    try {
      const res = await getCertificateByStudent(studentInput.trim());
      setStudentResults(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Search failed.");
    }
    setLoading(false);
  };

  const verify = async (hash: string) => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await verifyCertificate(hash);
      setResult(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Verification failed.");
    }
    setLoading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          setHashInput(code.data);
          setMode("hash");
          verify(code.data);
        } else {
          setError("No QR code found in the image.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-emerald-500/10">
          <Search size={28} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Verify Certificate</h2>
          <p className="text-gray-400 text-sm">Enter a certificate hash or student ID to check its blockchain status.</p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 bg-white/[.04] rounded-xl p-1">
        <button
          onClick={() => { setMode("hash"); setResult(null); setStudentResults([]); setError(null); }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === "hash" ? "bg-primary-600 text-white shadow" : "text-gray-400 hover:text-white"}`}
        >
          By Certificate Hash
        </button>
        <button
          onClick={() => { setMode("student"); setResult(null); setStudentResults([]); setError(null); }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === "student" ? "bg-primary-600 text-white shadow" : "text-gray-400 hover:text-white"}`}
        >
          By Student ID
        </button>
      </div>

      {/* Form */}
      <form onSubmit={mode === "hash" ? handleHashVerify : handleStudentSearch} className="glass-card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            {mode === "hash" ? "Certificate Hash" : "Student ID"}
          </label>
          <input
            type="text"
            value={mode === "hash" ? hashInput : studentInput}
            onChange={(e) => mode === "hash" ? setHashInput(e.target.value) : setStudentInput(e.target.value)}
            placeholder={mode === "hash" ? "0x abc123…" : "STU-2024-001"}
            className="input-field font-mono text-sm"
          />
        </div>

        {mode === "hash" && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="qr-upload"
              />
              <label
                htmlFor="qr-upload"
                className="cursor-pointer flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                <Upload size={16} />
                Upload QR Code
              </label>
            </div>
            <span className="text-gray-600 text-xs">or enter hash manually</span>
          </div>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying…</> : "Verify"}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="glass-card p-4 border-red-500/20 bg-red-500/[.04]">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Result — hash mode */}
      {result && mode === "hash" && (
        <div className={`glass-card p-6 space-y-4 border-${result.isValid ? "emerald" : "red"}-500/20 bg-${result.isValid ? "emerald" : "red"}-500/[.04]`}>
          <div className="flex items-center gap-3">
            {result.isValid ? (
              <CheckCircle size={28} className="text-emerald-400" />
            ) : (
              <XCircle size={28} className="text-red-400" />
            )}
            <h3 className={`text-lg font-bold ${result.isValid ? "text-emerald-400" : "text-red-400"}`}>
              {result.isValid ? "Certificate is VALID" : "Certificate is INVALID / Revoked"}
            </h3>
          </div>
          {result.certificate && <CertCard cert={result.certificate} />}
          <p className="text-gray-400 text-sm">{result.message}</p>
        </div>
      )}

      {/* Result — student mode */}
      {studentResults.length > 0 && mode === "student" && (
        <div className="space-y-3">
          <p className="text-gray-400 text-sm">{studentResults.length} certificate(s) found.</p>
          {studentResults.map((c) => (
            <div key={c.certificateHash} className="glass-card p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className={c.isValid ? "badge-valid" : "badge-invalid"}>
                  {c.isValid ? "✓ Valid" : "✕ Revoked"}
                </span>
                <a
                  href={`https://sepolia.etherscan.io/tx/${c.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 text-xs hover:underline flex items-center gap-1"
                >
                  <ExternalLink size={12} /> Etherscan
                </a>
              </div>
              <CertCard cert={c} />
            </div>
          ))}
        </div>
      )}

      {studentResults.length === 0 && !loading && studentInput && mode === "student" && !error && (
        <div className="glass-card p-6 text-center text-gray-400">No certificates found for this student ID.</div>
      )}
    </div>
  );
}

function CertCard({ cert }: { cert: CertificateRecord }) {
  return (
    <div className="bg-white/[.03] rounded-xl p-4 space-y-2">
      <Row label="Student" value={`${cert.studentName} · ${cert.studentId}`} />
      <Row label="Course" value={cert.courseName} />
      <Row label="Institution" value={cert.institutionName} />
      <Row label="Grade" value={cert.grade || "N/A"} />
      <Row label="Issued" value={cert.issuanceDate} />
      {cert.expiryDate && <Row label="Expires" value={cert.expiryDate} />}
      <Row label="Cert Hash" value={cert.certificateHash} mono />
      <Row label="Tx Hash" value={cert.txHash} mono />
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
      <span className="text-gray-500 text-xs uppercase tracking-wide">{label}</span>
      <span className={`text-gray-300 text-sm ${mono ? "font-mono text-xs break-all" : ""}`}>{value}</span>
    </div>
  );
}
