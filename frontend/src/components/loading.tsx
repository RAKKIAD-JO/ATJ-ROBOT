"use client";

import { BeatLoader } from "react-spinners";
import "@/styles/loading.css";

export default function Loading() {
  return (
    <main className="main-loading" style={{ textAlign: 'center', paddingTop: '5rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>ATJ ROBOT</h1>
      <BeatLoader color="#36d7b7" size={20} />
    </main>
  );
}
