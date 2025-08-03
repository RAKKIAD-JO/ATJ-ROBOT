"use client";

import { RingLoader } from "react-spinners";
import "@/styles/loading.css";

export default function Page() {
  return (
    <main className="main-loading">
      <h1 className="title-loading">ATJROBOT</h1>
      <RingLoader color="#17a2b8"  size={80}/>
    </main>
  );
}