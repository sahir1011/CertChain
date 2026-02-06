import axios from "axios";

const BASE_URL = process.env.BACKEND_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 60000,
  withCredentials: true, // Include cookies for session management
});

// ── Types ──────────────────────────────────────
export interface CertificatePayload {
  studentName: string;
  studentId: string;
  courseName: string;
  institutionName: string;
  issuanceDate: string;
  expiryDate?: string;
  grade?: string;
  issuerAddress: string;
}

export interface CertificateRecord {
  certificateHash: string;
  studentName: string;
  studentId: string;
  courseName: string;
  institutionName: string;
  issuanceDate: string;
  expiryDate: string;
  grade: string;
  isValid: boolean;
  issuerAddress: string;
  txHash: string;
  blockNumber: number;
  timestamp: number;
}

export interface VerifyResponse {
  isValid: boolean;
  certificate?: CertificateRecord;
  message: string;
}

export interface HealthResponse {
  status: string;
  contractAddress: string;
  network: string;
  blockNumber: number;
}

// ── Endpoints ──────────────────────────────────
export async function healthCheck(): Promise<HealthResponse> {
  const { data } = await api.get("/api/health");
  return data;
}

export async function issueCertificate(payload: CertificatePayload): Promise<CertificateRecord> {
  const { data } = await api.post("/api/certificates/issue", payload);
  return data;
}

export async function verifyCertificate(certificateHash: string): Promise<VerifyResponse> {
  const { data } = await api.get(`/api/certificates/verify/${certificateHash}`);
  return data;
}

export async function getCertificateByStudent(studentId: string): Promise<CertificateRecord[]> {
  const { data } = await api.get(`/api/certificates/student/${studentId}`);
  return data;
}

export async function listCertificates(): Promise<CertificateRecord[]> {
  const { data } = await api.get("/api/certificates");
  return data;
}

export async function revokeCertificate(certificateHash: string, issuerAddress: string): Promise<{ txHash: string }> {
  const { data } = await api.post("/api/certificates/revoke", { certificateHash, issuerAddress });
  return data;
}

export default api;
