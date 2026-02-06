"use client";

import "../styles/globals.css";
import { useEffect } from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.title = "CertChain – Blockchain Certificate Validation";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Verify and issue student certificates on the Ethereum Sepolia blockchain.");
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="description" content="Verify and issue student certificates on the Ethereum Sepolia blockchain." />
      </head>
      <body>{children}</body>
    </html>
  );
}
