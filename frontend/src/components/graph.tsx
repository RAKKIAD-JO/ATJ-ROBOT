"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PieChart } from '@mui/x-charts/PieChart';
import "@/styles/graph.css";
import { useSelectedRobot } from "@/app/contexts/SelectedRobotContext";

export default function Graph() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const {selectedRobot} = useSelectedRobot();

  useEffect(() => {
    fetch("/api/users/profile", {
      credentials: "include"
    })
      .then(res => {
        if (res.status === 403 || res.status === 401) {
          setErrorMessage('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
          router.replace('/');
          return;
        }
        return res.json();
      })
      .catch((err) => {
        setErrorMessage('เกิดข้อผิดพลาดในการดึงข้อมูล: ' + err.message);
      });
  }, [router]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  const pieData = [
    { id: 0, value: 1000, label: "น้ำ" },
    { id: 1, value: 500, label: "ปุ๋ย" },
    { id: 2, value: 200, label: "สารเคมีอันตราย" },
  ];

  return (
    <main className="graph-dashboard">
      {errorMessage && (
        <div className="error-message" style={{ color: "red", marginBottom: 12 }}>
          {errorMessage}
        </div>
      )}
      <section className="graph-left-panel">
        <h2 className="graph-title">ภาพรวมการใช้สารเคมี</h2>
        {selectedRobot ? (
          <div className="selected-robot-info">
            <p>หุ่นยนต์ที่เลือก: {selectedRobot.robot_name}</p>
          </div>
        ) : (
          <p>โปรดเลือกหุ่นยนต์จากเมนูด้านข้าง</p>
        )}

        <div className="graph-filters">
          <label className="graph-label">เลือกวันที่เริ่มต้น:</label>
          <input
            type="date"
            className="graph-date-picker"
            value={startDate}
            onChange={handleStartDateChange}
          />
          <label className="graph-label">เลือกวันที่สิ้นสุด:</label>
          <input
            type="date"
            className="graph-date-picker"
            value={endDate}
            onChange={handleEndDateChange}
          />
        </div>

        <div className="graph-main-chart">
          <div className="line-graph-chart">[กราฟเส้นสารเคมีทั้งหมด]</div>
          <div className="bar-graph-chart">[กราฟแท่งสารเคมีทั้งหมด]</div>
        </div>
      </section>

      <section className="graph-right-panel">
        <div className="graph-chemical-list">
          <div className="chemical-water-item">
            <span className="chemical-water-icon">💧</span>
            <p className="chemical-water-text">น้ำ</p>
            <p className="chemical-water-usage">1000 L</p>
          </div>
          <div className="chemical-fertilizer-item">
            <span className="chemical-fertilizer-icon">🌱</span>
            <p className="chemical-fertilizer-text">ปุ๋ย</p>
            <p className="chemical-fertilizer-usage">500 kg</p>
          </div>
          <div className="chemical-hazardous-item">
            <span className="chemical-hazardous-icon">☠️</span>
            <p className="chemical-hazardous-text">สารเคมีอันตราย</p>
            <p className="chemical-hazardous-usage">200 L</p>
          </div>
        </div>
        <div className="graph-detail-box">
          <h3 className="graph-subtitle">ปริมาณการใช้ของเหลว</h3>
          <PieChart
            series={[
              {
                data: pieData,
                innerRadius: 30,
                outerRadius: 100,
                paddingAngle: 5,
                cornerRadius: 5,
                startAngle: -90,
                endAngle: 270,
              },
            ]}
            width={200}
            height={130}
          />
        </div>
      </section>
    </main>
  );
}
