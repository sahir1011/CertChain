"use client";
import { useState, FormEvent } from "react";
import { FileText, Loader2, CheckCircle, ExternalLink, AlertCircle, Download } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useWallet } from "@/utils/walletContext";
import { issueCertificate } from "@/utils/api";
import type { CertificateRecord } from "@/utils/api";

export default function IssueCertificate() {
  const { isConnected, account, isCorrectNetwork } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<CertificateRecord | null>(null);

  const [form, setForm] = useState({
    studentName: "",
    studentId: "",
    courseName: "",
    institutionName: "",
    issuanceDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    grade: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isConnected || !account) {
      setError("Please connect your MetaMask wallet first.");
      return;
    }
    if (!isCorrectNetwork) {
      setError("Please switch to the Sepolia test network.");
      return;
    }
    setLoading(true);
    try {
      const cert = await issueCertificate({ ...form, issuerAddress: account });
      setIssued(cert);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to issue certificate.");
    }
    setLoading(false);
  };

  const reset = () => {
    setIssued(null);
    setForm({
      studentName: "",
      studentId: "",
      courseName: "",
      institutionName: "",
      issuanceDate: new Date().toISOString().split("T")[0],
      expiryDate: "",
      grade: "",
    });
  };

  const downloadQRCode = () => {
    const canvas = document.querySelector("canvas");
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${issued?.studentId || "qr"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // ── Success receipt ──
  if (issued) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="glass-card p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle size={48} className="text-emerald-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">Certificate Issued Successfully</h2>
          <p className="text-gray-400">The certificate has been stored on the Ethereum Sepolia blockchain.</p>

          <div className="bg-white/[.04] rounded-xl p-5 text-left space-y-3">
            <Row label="Certificate Hash" value={issued.certificateHash} mono />
            <Row label="Transaction Hash" value={issued.txHash} mono />
            <Row label="Block Number" value={String(issued.blockNumber)} />
            <Row label="Student" value={`${issued.studentName} (${issued.studentId})`} />
            <Row label="Course" value={issued.courseName} />
            <Row label="Institution" value={issued.institutionName} />
            <Row label="Grade" value={issued.grade || "N/A"} />
            <Row label="Issued" value={issued.issuanceDate} />
            {issued.expiryDate && <Row label="Expires" value={issued.expiryDate} />}
          </div>

          <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-xl">
            <QRCodeCanvas
              value={issued.certificateHash}
              size={160}
              level="H"
              includeMargin={true}
            />
            <button
              onClick={downloadQRCode}
              className="text-sm text-gray-600 hover:text-primary-600 flex items-center gap-1 font-medium"
            >
              <Download size={14} /> Download QR Code
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`https://sepolia.etherscan.io/tx/${issued.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <ExternalLink size={16} /> View on Etherscan
            </a>
            <button onClick={reset} className="btn-primary">Issue Another</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-primary-500/10">
          <FileText size={28} className="text-primary-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Issue New Certificate</h2>
          <p className="text-gray-400 text-sm">Fill in the details below. The certificate will be hashed and stored on Sepolia.</p>
        </div>
      </div>

      {/* Warning if not connected */}
      {(!isConnected || !isCorrectNetwork) && (
        <div className="glass-card p-4 flex items-center gap-3 border-amber-500/20 bg-amber-500/[.04]">
          <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
          <p className="text-amber-300 text-sm">
            {!isConnected ? "Connect your wallet to issue certificates." : "Switch to Sepolia testnet."}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass-card p-4 flex items-center gap-3 border-red-500/20 bg-red-500/[.04]">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Student Name *" name="studentName" value={form.studentName} onChange={handleChange} placeholder="John Doe" required />
          <Field label="Student ID *" name="studentId" value={form.studentId} onChange={handleChange} placeholder="STU-2024-001" required />
          <Field label="Course Name *" name="courseName" value={form.courseName} onChange={handleChange} placeholder="B.Tech Computer Science" required />
          <Field label="Institution *" name="institutionName" value={form.institutionName} onChange={handleChange} placeholder="MIT" required />
          <Field label="Issuance Date *" name="issuanceDate" type="date" value={form.issuanceDate} onChange={handleChange} required />
          <Field label="Expiry Date" name="expiryDate" type="date" value={form.expiryDate} onChange={handleChange} />
        </div>

        {/* Grade select */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Grade</label>
          <select name="grade" value={form.grade} onChange={handleChange} className="input-field bg-white/[.05]">
            <option value="" className="bg-blockchain-card">Select grade…</option>
            {["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F", "Pass", "Honors"].map((g) => (
              <option key={g} value={g} className="bg-blockchain-card">{g}</option>
            ))}
          </select>
        </div>

        {/* Issuer preview */}
        <div className="bg-white/[.03] rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Issuer Address (from wallet)</p>
          <p className="text-sm font-mono text-gray-400">{account || "Not connected"}</p>
        </div>

        <button type="submit" disabled={loading || !isConnected} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? <><Loader2 size={18} className="animate-spin" /> Issuing on Blockchain…</> : "Issue Certificate"}
        </button>
      </form>
    </div>
  );
}

// ── Helpers ──
function Field({ label, name, value, onChange, placeholder, type = "text", required }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="input-field"
      />
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className={`text-gray-200 text-sm ${mono ? "font-mono break-all text-xs" : ""}`}>{value}</span>
    </div>
  );
}
