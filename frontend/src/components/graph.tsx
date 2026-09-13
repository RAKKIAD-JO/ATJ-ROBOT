"use client";

import React, { useState, useEffect } from "react";
import { useSelectedRobot } from "@/app/contexts/SelectedRobotContext";
import Loading from "@/components/loading";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SprayCount {
  date: string;
  water: number;
  fertilizer: number;
  pesticide: number;
}

interface UsageByType {
  water: number;
  fertilizer: number;
  pesticide: number;
}

export default function Graph() {
  const { selectedRobot } = useSelectedRobot();
  const [rangeFilter, setRangeFilter] = useState<"today" | "7days" | "30days">("7days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sprayCounts, setSprayCounts] = useState<SprayCount[]>([]);
  const [usageByType, setUsageByType] = useState<UsageByType>({
    water: 0,
    fertilizer: 0,
    pesticide: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    let daysToSubtract = 7;
    if (rangeFilter === "today") daysToSubtract = 0;
    if (rangeFilter === "30days") daysToSubtract = 30;

    const start = new Date(now);
    start.setDate(start.getDate() - daysToSubtract);
    const startY = start.getFullYear();
    const startM = String(start.getMonth() + 1).padStart(2, "0");
    const startD = String(start.getDate()).padStart(2, "0");
    const startStr = `${startY}-${startM}-${startD}`;

    setStartDate(startStr);
    setEndDate(todayStr);
  }, [rangeFilter, selectedRobot]);

  useEffect(() => {
    async function fetchData() {
      if (!selectedRobot?.device_id || !startDate || !endDate) return;
      setLoading(true);
      try {
        const [resGraph, resType] = await Promise.all([
          fetch(
            `/robot/usage-liquidType-Graph?device_id=${encodeURIComponent(
              selectedRobot.device_id
            )}&startDate=${startDate}&endDate=${endDate}&groupBy=day`,
            { credentials: "include" }
          ).then((r) => r.json()).catch(() => null),
          fetch(
            `/robot/usage-liquidType?device_id=${encodeURIComponent(
              selectedRobot.device_id
            )}&startDate=${startDate}&endDate=${endDate}`,
            { credentials: "include" }
          ).then((r) => r.json()).catch(() => null),
        ]);

        if (resGraph?.success && Array.isArray(resGraph.data)) {
          setSprayCounts(resGraph.data);
        } else {
          setSprayCounts([]);
        }

        if (resType?.success && resType.totals) {
          setUsageByType(resType.totals);
        } else {
          setUsageByType({ water: 0, fertilizer: 0, pesticide: 0 });
        }
      } catch (error) {
        console.error("Graph fetch error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedRobot, startDate, endDate]);

  const defaultLabels = ["01:01", "01:02", "01:03", "01:04", "01:05", "01:06", "01:07", "01:08", "01:09", "01:10"];
  const batteryData = [99, 98, 96, 95, 94, 92, 90, 88, 87, 86];
  const volumeData = [0.2, 0.6, 1.1, 1.6, 2.1, 2.6, 3.0, 3.4, 3.7, 3.98];
  const waterLvlData = [98, 95, 93, 89, 86, 84, 80, 76, 72, 68];

  const battAvg = (batteryData.reduce((a, b) => a + b, 0) / batteryData.length).toFixed(1);

  const baseChartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1D2731",
        borderColor: "#2A3440",
        borderWidth: 1,
        padding: 10,
        titleColor: "#EAF0F5",
        bodyColor: "#C4CDD6",
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255, 255, 255, 0.05)", drawTicks: false },
        border: { display: false },
        ticks: { color: "#8D9AAA" },
      },
      y: {
        grid: { color: "rgba(255, 255, 255, 0.05)", drawTicks: false },
        border: { display: false },
        ticks: { color: "#8D9AAA" },
      },
    },
  };

  const chartBattData = {
    labels: defaultLabels,
    datasets: [
      {
        data: batteryData,
        borderColor: "#4ADE80",
        backgroundColor: "rgba(74, 222, 128, 0.08)",
        fill: true,
        pointBorderColor: "#4ADE80",
        tension: 0.3,
      },
    ],
  };

  const chartVolData = {
    labels: defaultLabels,
    datasets: [
      {
        data: volumeData,
        backgroundColor: "#3FA9E6",
        borderRadius: 3,
        maxBarThickness: 22,
      },
    ],
  };

  const chartWaterLvlConfig = {
    labels: defaultLabels,
    datasets: [
      {
        data: waterLvlData,
        borderColor: "#F0A93A",
        backgroundColor: "rgba(240, 169, 58, 0.08)",
        fill: true,
        pointBorderColor: "#F0A93A",
        tension: 0.3,
      },
    ],
  };

  if (loading && sprayCounts.length === 0) {
    return <Loading />;
  }

  return (
    <main className="content">
      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="seg-control">
          <div
            className={`seg-btn ${rangeFilter === "today" ? "active" : ""}`}
            onClick={() => setRangeFilter("today")}
          >
            วันนี้
          </div>
          <div
            className={`seg-btn ${rangeFilter === "7days" ? "active" : ""}`}
            onClick={() => setRangeFilter("7days")}
          >
            7 วัน
          </div>
          <div
            className={`seg-btn ${rangeFilter === "30days" ? "active" : ""}`}
            onClick={() => setRangeFilter("30days")}
          >
            30 วัน
          </div>
        </div>

        <select className="select-field">
          <option>{selectedRobot ? selectedRobot.robot_name : "Simulated Robo"}</option>
        </select>

        <select className="select-field">
          <option>ทุกตัวชี้วัด</option>
          <option>แบตเตอรี่</option>
          <option>ปริมาณน้ำ</option>
        </select>

        <button className="btn secondary ghost" style={{ marginLeft: "auto" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3v13m0 0l-4-4m4 4l4-4M4 21h16" />
          </svg>
          ส่งออกข้อมูล
        </button>
      </div>

      {/* Chart 1: Battery */}
      <div className="panel chart-panel" style={{ marginBottom: "16px" }}>
        <div className="section-head">
          <div className="section-title">แบตเตอรี่ (%)</div>
          <div className="section-sub num">ค่าเฉลี่ย {battAvg}%</div>
        </div>
        <div className="chart-box">
          <Line data={chartBattData} options={baseChartOpts} />
        </div>
      </div>

      {/* Chart 2 & 3: Volume & Water Level */}
      <div className="grid-2col">
        <div className="panel chart-panel">
          <div className="section-head">
            <div className="section-title">ปริมาณน้ำสะสม (ลิตร)</div>
            <div className="section-sub">
              น้ำ: {usageByType.water}L | ปุ๋ย: {usageByType.fertilizer}L | ยา: {usageByType.pesticide}L
            </div>
          </div>
          <div className="chart-box" style={{ height: "220px" }}>
            <Bar data={chartVolData} options={baseChartOpts} />
          </div>
        </div>

        <div className="panel chart-panel">
          <div className="section-head">
            <div className="section-title">ระดับน้ำถัง (%)</div>
          </div>
          <div className="chart-box" style={{ height: "220px" }}>
            <Line data={chartWaterLvlConfig} options={baseChartOpts} />
          </div>
        </div>
      </div>
    </main>
  );
}