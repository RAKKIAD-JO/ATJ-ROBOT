"use client";

import { RingLoader } from "react-spinners";

export default function Loading() {
  return (
    <main className="fixed inset-0 bg-white/90 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-extrabold text-[#17a2b8] tracking-wider animate-pulse">
        ATJROBOT
      </h1>
      <RingLoader color="#17a2b8" size={80} />
    </main>
  );
}