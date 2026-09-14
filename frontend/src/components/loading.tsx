"use client";

import { RingLoader } from "react-spinners";

export default function Loading() {
  return (
    <main className="fixed inset-0 bg-[var(--bg)]/90 backdrop-blur-md z-[9999] flex flex-col items-center justify-center gap-4 transition-colors duration-300">
      <h1 className="text-3xl font-extrabold text-[var(--accent)] tracking-wider animate-pulse font-mono">
        ATJROBOT
      </h1>
      <RingLoader color="var(--accent)" size={80} />
    </main>
  );
}