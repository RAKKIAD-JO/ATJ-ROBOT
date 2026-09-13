"use client";

import React, { useState, useEffect } from "react";
import { useSelectedRobot } from "@/app/contexts/SelectedRobotContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ChemicalItem {
  name: string;
  cat: "ปุ๋ย" | "สารเคมี" | "น้ำ";
  total: number;
  uses: number;
  last: string;
}

const catColors: Record<string, string> = {
  ปุ๋ย: "#4ADE80",
  สารเคมี: "#3FA9E6",
  น้ำ: "#F0A93A",
};

export default function Graph() {
  const { selectedRobot } = useSelectedRobot();
  const [rangeFilter, setRangeFilter] = useState<"today" | "7days" | "30days">("7days");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedRobotFilter, setSelectedRobotFilter] = useState<string>("all");

  const defaultChemicals: ChemicalItem[] = [
    { name: "ปุ๋ยน้ำอินทรีย์ สูตรเร่งโต", cat: "ปุ๋ย", total: 68.5, uses: 6, last: "13/09/2569" },
    { name: "สารกำจัดวัชพืช", cat: "สารเคมี", total: 31.6, uses: 4, last: "11/09/2569" },
    { name: "ยาป้องกันเชื้อรา", cat: "สารเคมี", total: 22.3, uses: 3, last: "12/09/2569" },
    { name: "ปุ๋ยเคมีสูตร 15-15-15", cat: "ปุ๋ย", total: 18.9, uses: 2, last: "11/09/2569" },
    { name: "น้ำหมักชีวภาพ / น้ำสะอาด", cat: "น้ำ", total: 9.4, uses: 2, last: "09/09/2569" },
  ];

  const [chemicals, setChemicals] = useState<ChemicalItem[]>(defaultChemicals);

  useEffect(() => {
    if (!selectedRobot?.device_id) return;

    fetch(`/robot/usage-liquidType?device_id=${encodeURIComponent(selectedRobot.device_id)}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.items)) {
          setChemicals(data.items);
        }
      })
      .catch(() => {});
  }, [selectedRobot]);

  // Filter chemicals by selected category
  const filteredChemicals = chemicals.filter((item) => {
    if (selectedCategory !== "all" && item.cat !== selectedCategory) return false;
    return true;
  });

  const totalVolumeSum = filteredChemicals.reduce((acc, curr) => acc + curr.total, 0);
  const totalUsesSum = filteredChemicals.reduce((acc, curr) => acc + curr.uses, 0);
  const topUsedItem = [...filteredChemicals].sort((a, b) => b.total - a.total)[0] || defaultChemicals[0];
  const avgPerSpray = totalUsesSum > 0 ? (totalVolumeSum / totalUsesSum).toFixed(2) : "0.00";

  // Category totals for Donut Chart
  const catTotals: Record<string, number> = {};
  filteredChemicals.forEach((c) => {
    catTotals[c.cat] = (catTotals[c.cat] || 0) + c.total;
  });
  const catLabels = Object.keys(catTotals);

  // Export CSV
  const handleExport = () => {
    const headers = ["สารเคมี/ของเหลว", "หมวดหมู่", "ปริมาณรวม (ลิตร)", "จำนวนครั้งที่ใช้", "ใช้ล่าสุด", "สัดส่วน (%)"];
    const rows = filteredChemicals.map((c) => [
      `"${c.name}"`,
      `"${c.cat}"`,
      `"${c.total.toFixed(1)}"`,
      `"${c.uses}"`,
      `"${c.last}"`,
      `"${((c.total / (totalVolumeSum || 1)) * 100).toFixed(1)}%"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `chemical_usage_${rangeFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Base Chart Options
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

  // 1. Ranked Horizontal Bar Chart Data
  const sortedChem = [...filteredChemicals].sort((a, b) => b.total - a.total);
  const chemBarData = {
    labels: sortedChem.map((c) => c.name),
    datasets: [
      {
        data: sortedChem.map((c) => c.total),
        backgroundColor: sortedChem.map((c) => catColors[c.cat] || "#25C2B8"),
        borderRadius: 4,
        maxBarThickness: 22,
      },
    ],
  };

  const chemBarOptions = {
    ...baseChartOpts,
    indexAxis: "y" as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { x: number } }) => `${ctx.parsed.x} ลิตร`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255, 255, 255, 0.05)", drawTicks: false },
        border: { display: false },
        ticks: { color: "#8D9AAA" },
        title: { display: true, text: "ลิตร", color: "#8D9AAA" },
      },
      y: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#8D9AAA" },
      },
    },
  };

  // 2. Category Donut Chart Data
  const chemDonutData = {
    labels: catLabels,
    datasets: [
      {
        data: catLabels.map((l) => catTotals[l]),
        backgroundColor: catLabels.map((l) => catColors[l] || "#25C2B8"),
        borderWidth: 0,
      },
    ],
  };

  const chemDonutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1D2731",
        borderColor: "#2A3440",
        borderWidth: 1,
        padding: 10,
        titleColor: "#EAF0F5",
        bodyColor: "#C4CDD6",
        callbacks: {
          label: (ctx: { parsed: number; label: string }) =>
            `${ctx.label}: ${ctx.parsed.toFixed(1)} ล. (${(
              (ctx.parsed / (totalVolumeSum || 1)) *
              100
            ).toFixed(0)}%)`,
        },
      },
    },
  };

  // 3. Daily Stacked Bar Chart Data
  const dayLabels = ["08/09", "09/09", "10/09", "11/09", "12/09", "13/09"];
  const stackSeries: Record<string, number[]> = {
    ปุ๋ย: [8.2, 0, 6.4, 0, 0, 53.9],
    สารเคมี: [0, 6.0, 0, 25.6, 22.3, 0],
    น้ำ: [0, 9.4, 0, 0, 0, 0],
  };

  const stackDatasets = Object.keys(stackSeries)
    .filter((cat) => selectedCategory === "all" || selectedCategory === cat)
    .map((cat) => ({
      label: cat,
      data: stackSeries[cat],
      backgroundColor: catColors[cat] || "#25C2B8",
      borderRadius: 3,
      maxBarThickness: 34,
    }));

  const chemStackData = {
    labels: dayLabels,
    datasets: stackDatasets,
  };

  const chemStackOptions = {
    ...baseChartOpts,
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#8D9AAA" },
      },
      y: {
        stacked: true,
        grid: { color: "rgba(255, 255, 255, 0.05)", drawTicks: false },
        border: { display: false },
        ticks: { color: "#8D9AAA" },
        title: { display: true, text: "ลิตร", color: "#8D9AAA" },
      },
    },
  };

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

        <select
          className="select-field"
          value={selectedRobotFilter}
          onChange={(e) => setSelectedRobotFilter(e.target.value)}
        >
          <option value="all">หุ่นยนต์ทั้งหมด</option>
          <option value="selected">
            {selectedRobot ? selectedRobot.robot_name : "Simulated Robo"}
          </option>
          <option value="robo2">Robo Field-02</option>
          <option value="robo3">Robo Field-03</option>
        </select>

        <select
          className="select-field"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">ประเภทของเหลวทั้งหมด</option>
          <option value="ปุ๋ย">ปุ๋ย</option>
          <option value="สารเคมี">สารเคมี</option>
          <option value="น้ำ">น้ำ</option>
        </select>

        <button className="btn secondary ghost" style={{ marginLeft: "auto" }} onClick={handleExport}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3v13m0 0l-4-4m4 4l4-4M4 21h16" />
          </svg>
          ส่งออกข้อมูล
        </button>
      </div>

      {/* Chemical Usage Overview Metrics Grid */}
      <div className="metric-grid mb-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {/* Card 1: Total Volume */}
        <div className="metric-card" style={{ minHeight: "auto", padding: "16px" }}>
          <div className="metric-sub">ปริมาณของเหลว/สารเคมีรวม</div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="num text-2xl font-bold">{totalVolumeSum.toFixed(1)}</span>
            <span className="text-xs text-[var(--text-mid)]">
              ลิตร / {rangeFilter === "today" ? "วันนี้" : rangeFilter === "7days" ? "7 วัน" : "30 วัน"}
            </span>
          </div>
        </div>

        {/* Card 2: Categories */}
        <div
          className="metric-card"
          style={
            {
              minHeight: "auto",
              padding: "16px",
              "--m-color": "#3FA9E6",
              "--m-color-soft": "#123549",
            } as React.CSSProperties
          }
        >
          <div className="metric-sub">ประเภทของเหลวที่ใช้</div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="num text-2xl font-bold">{catLabels.length}</span>
            <span className="text-xs text-[var(--text-mid)]">
              ชนิด · 3 หมวดหมู่ (น้ำ / ปุ๋ย / สารเคมี)
            </span>
          </div>
        </div>

        {/* Card 3: Top Used */}
        <div
          className="metric-card"
          style={
            {
              minHeight: "auto",
              padding: "16px",
              "--m-color": "var(--good)",
              "--m-color-soft": "var(--good-soft)",
            } as React.CSSProperties
          }
        >
          <div className="metric-sub">ใช้มากที่สุด</div>
          <div className="mt-2 text-sm font-semibold truncate leading-tight">
            {topUsedItem ? topUsedItem.name : "ปุ๋ยน้ำอินทรีย์"}
          </div>
          <div className="num text-xs text-[var(--good)] mt-0.5">
            {topUsedItem ? topUsedItem.total.toFixed(1) : 0} ล. ·{" "}
            {(
              ((topUsedItem ? topUsedItem.total : 0) / (totalVolumeSum || 1)) *
              100
            ).toFixed(0)}
            % ของทั้งหมด
          </div>
        </div>

        {/* Card 4: Average Spray */}
        <div
          className="metric-card"
          style={
            {
              minHeight: "auto",
              padding: "16px",
              "--m-color": "var(--warn)",
              "--m-color-soft": "var(--warn-soft)",
            } as React.CSSProperties
          }
        >
          <div className="metric-sub">เฉลี่ยต่อรอบฉีดพ่น</div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="num text-2xl font-bold">{avgPerSpray}</span>
            <span className="text-xs text-[var(--text-mid)]">ลิตร / ครั้ง</span>
          </div>
        </div>
      </div>

      {/* Grid 2 Column: Bar Chart & Donut Chart */}
      <div className="grid-2col mb-4">
        {/* Left Chart: Horizontal Ranked Bar Chart */}
        <div className="panel chart-panel">
          <div className="section-head">
            <div>
              <div className="section-title">ปริมาณการใช้แยกตามชนิดสารเคมี/ของเหลว</div>
              <div className="section-sub">เรียงจากมากไปน้อย · ล่าสุด</div>
            </div>
          </div>
          <div className="chart-box" style={{ height: "250px" }}>
            <Bar data={chemBarData} options={chemBarOptions} />
          </div>
        </div>

        {/* Right Chart: Donut Chart & Legend */}
        <div className="panel chart-panel">
          <div className="section-head">
            <div>
              <div className="section-title">สัดส่วนตามหมวดหมู่ (น้ำ / ปุ๋ย / สารเคมี)</div>
              <div className="section-sub">% ของปริมาณรวม</div>
            </div>
          </div>
          <div
            className="chart-box"
            style={{
              height: "210px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <Doughnut data={chemDonutData} options={chemDonutOptions} />
          </div>
          <div className="legend-row mt-2 mb-3">
            {catLabels.map((l) => (
              <div key={l} className="legend-item">
                <span
                  className="legend-swatch"
                  style={{ background: catColors[l] || "var(--accent)" }}
                ></span>
                {l} · {(((catTotals[l] || 0) / (totalVolumeSum || 1)) * 100).toFixed(0)}%
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Stacked Usage Chart */}
      <div className="panel chart-panel mb-4">
        <div className="section-head">
          <div>
            <div className="section-title">แนวโน้มการใช้สารเคมี/ของเหลวรายวัน</div>
            <div className="section-sub">แยกสีตามหมวดหมู่ (น้ำ / ปุ๋ย / สารเคมี) · ลิตร/วัน</div>
          </div>
        </div>
        <div className="legend-row">
          {Object.keys(stackSeries)
            .filter((cat) => selectedCategory === "all" || selectedCategory === cat)
            .map((cat) => (
              <div key={cat} className="legend-item">
                <span
                  className="legend-swatch"
                  style={{ background: catColors[cat] || "var(--accent)" }}
                ></span>
                {cat}
              </div>
            ))}
        </div>
        <div className="chart-box">
          <Bar data={chemStackData} options={chemStackOptions} />
        </div>
      </div>

      {/* Chemical Detail Table */}
      <div className="panel">
        <div className="section-head" style={{ padding: "16px 18px 0" }}>
          <div className="section-title">รายละเอียดการใช้สารเคมีตามชนิด</div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>สารเคมี / ของเหลว</th>
                <th>หมวดหมู่</th>
                <th>ปริมาณรวม</th>
                <th>จำนวนครั้งที่ใช้</th>
                <th>ใช้ล่าสุด</th>
                <th>สัดส่วน</th>
              </tr>
            </thead>
            <tbody>
              {filteredChemicals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-[var(--text-low)]">
                    ไม่พบข้อมูลสารเคมีตามหมวดหมู่ที่เลือก
                  </td>
                </tr>
              ) : (
                sortedChem.map((c, idx) => {
                  const pct = (c.total / (totalVolumeSum || 1)) * 100;
                  const catColor = catColors[c.cat] || "var(--accent)";
                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: "600" }}>{c.name}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: `${catColor}22`,
                            color: catColor,
                          }}
                        >
                          {c.cat}
                        </span>
                      </td>
                      <td className="num">{c.total.toFixed(1)} ล.</td>
                      <td className="num">{c.uses} ครั้ง</td>
                      <td className="num">{c.last}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="mini-bar" style={{ width: "90px" }}>
                            <div
                              className="mini-bar-fill"
                              style={{
                                width: `${pct}%`,
                                background: catColor,
                              }}
                            ></div>
                          </div>
                          <span
                            className="num"
                            style={{ fontSize: "11.5px", color: "var(--text-mid)" }}
                          >
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}