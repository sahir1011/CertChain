"use client";

export default function Background() {
  return (
    <div className="fixed inset-0 z-0">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-blockchain-dark" />

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid bg-grid opacity-40" />

      {/* Gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary-600 opacity-10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600 opacity-10 rounded-full blur-3xl" />
      <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-primary-500 opacity-5 rounded-full blur-2xl" />

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-blockchain-dark to-transparent" />
    </div>
  );
}
