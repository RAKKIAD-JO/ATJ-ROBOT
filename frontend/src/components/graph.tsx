"use client";
import React, { useState, useEffect } from "react";
import { LineChart, BarChart } from "@mui/x-charts";
import { PieChart } from "@mui/x-charts/PieChart";
import "@/styles/graph.css";
import { useSelectedRobot } from "@/app/contexts/SelectedRobotContext";
import { useRouter } from "next/navigation";
import Loading from "@/components/loading";

type SprayCount = {
  date: string;
  water: number;
  fertilizer: number;
  pesticide: number;
};

type UsageByType = {
  water: number;
  fertilizer: number;
  pesticide: number;
};

interface User {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  profileImage: string;
  isAdmin: boolean;
}

export default function Graph() {
  const router = useRouter();
  const { selectedRobot } = useSelectedRobot();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sprayCounts, setSprayCounts] = useState<SprayCount[]>([]);
  const [usageByType, setUsageByType] = useState<UsageByType>({
    water: 0,
    fertilizer: 0,
    pesticide: 0,
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/users/profile", {
      method: "GET",
      credentials: "include",
    })
      .then(async (res) => {
        if (res.status === 403 || res.status === 401) {
          setErrorMessage("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
          router.replace("/");
          return;
        }
        const data = await res.json();
        setUser(data);
      })
      .catch((error) => {
        setErrorMessage("เกิดข้อผิดพลาดในการดึงข้อมูล: " + error.message);
      });
  }, [router]);

  async function fetchSprayCounts() {
    if (!selectedRobot || !startDate || !endDate) return;
    setLoading(true);
    try {
      const res = await fetch(`/robot/usage-liquidType-Graph?device_id=${encodeURIComponent(selectedRobot.device_id)}&startDate=${startDate}&endDate=${endDate}&groupBy=day`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      const contentType = res.headers.get("content-type");
      const text = await res.text();

      if (!res.ok || !contentType?.includes("application/json")) {
        setSprayCounts([]);
        throw new Error("ไม่พบข้อมูลของหุ่นยนต์ในวันที่เลือก");
      }

      const data = JSON.parse(text);
      if (data.success) setSprayCounts(data.data);
      else setSprayCounts([]);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      }
      setSprayCounts([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsageByType() {
    if (!selectedRobot || !startDate || !endDate) return;
    try {
      const res = await fetch(`/robot/usage-liquidType?device_id=${encodeURIComponent(selectedRobot.device_id)}&startDate=${startDate}&endDate=${endDate}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      const contentType = res.headers.get("content-type");
      const text = await res.text();

      if (!res.ok || !contentType?.includes("application/json")) {
        setUsageByType({ water: 0, fertilizer: 0, pesticide: 0 });
        throw new Error("ไม่พบข้อมูลของหุ่นยนต์ในวันที่เลือก");
      }

      const data = JSON.parse(text);
      if (data.success) {
        setUsageByType(data.totals);
      } else {
        setUsageByType({ water: 0, fertilizer: 0, pesticide: 0 });
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      }
      setUsageByType({ water: 0, fertilizer: 0, pesticide: 0 });
    }

  }

  const showModal = (message: string) => {
    setModalMessage(message);
  };

  const closeModal = () => {
    setModalMessage(null);
    setStartDate("");
    setEndDate("");
  };

  useEffect(() => {
    fetchSprayCounts();
    fetchUsageByType();
  }, [selectedRobot, startDate, endDate]);

  useEffect(() => {
    if (errorMessage) {
      showModal(errorMessage);
    } else {
      setModalMessage(null);
    }
  }, [selectedRobot, errorMessage]);

  const dates = sprayCounts.map((d) => d.date);
  const waterSeries = sprayCounts.map((d) => d.water);
  const fertilizerSeries = sprayCounts.map((d) => d.fertilizer);
  const pesticideSeries = sprayCounts.map((d) => d.pesticide);

  const pieData = [
    { id: 0, value: usageByType.water, label: "น้ำ" },
    { id: 1, value: usageByType.fertilizer, label: "ปุ๋ย" },
    { id: 2, value: usageByType.pesticide, label: "สารเคมี" },
  ];

  if (loading) {
    return <Loading />;
  }

  return (
    <main className="graph-dashboard">
      <section className="graph-dashboard-content">
        <div className="graph-header">
          <h2 className="graph-title">ภาพรวมการใช้สารเคมี</h2>
        </div>
        {!selectedRobot ? (
          <p>โปรดเลือกหุ่นยนต์จากเมนูด้านข้าง</p>
        ) : (
          <>
            <div className="selected-robot-info">
              <p>
                หุ่นยนต์ที่เลือก:{" "}
                {user?.isAdmin
                  ? selectedRobot.device_id
                  : selectedRobot.robot_name}
              </p>
            </div>
            <div className="graph-main-content">
              <section className="graph-left-panel">
                <div className="graph-filters">
                  <label className="graph-label">เลือกวันที่เริ่มต้น:</label>
                  <input
                    type="date"
                    className="graph-date-picker"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <label className="graph-label">เลือกวันที่สิ้นสุด:</label>
                  <input
                    type="date"
                    className="graph-date-picker"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div className="graph-main-chart">
                  <div className="line-graph-chart">
                    <LineChart
                      series={[
                        { data: waterSeries, label: "น้ำ" },
                        { data: fertilizerSeries, label: "ปุ๋ย" },
                        { data: pesticideSeries, label: "สารเคมี" },
                      ]}
                      xAxis={[{ scaleType: "point", data: dates }]}
                    />
                  </div>
                  <div className="bar-graph-chart">
                    <BarChart
                      series={[
                        { data: waterSeries, label: "น้ำ" },
                        { data: fertilizerSeries, label: "ปุ๋ย" },
                        { data: pesticideSeries, label: "สารเคมี" },
                      ]}
                      xAxis={[{ scaleType: "band", data: dates }]}
                    />
                  </div>
                </div>
              </section>

              <section className="graph-right-panel">
                <div className="graph-chemical-list">
                  <div className="chemical-water-item">
                    <p className="chemical-water-text">น้ำ</p>
                    <p className="chemical-water-usage">{usageByType.water.toFixed(2)} L</p>
                  </div>
                  <div className="chemical-fertilizer-item">
                    <p className="chemical-fertilizer-text">ปุ๋ย</p>
                    <p className="chemical-fertilizer-usage">{usageByType.fertilizer.toFixed(2)} L</p>
                  </div>
                  <div className="chemical-hazardous-item">
                    <p className="chemical-hazardous-text">สารเคมี</p>
                    <p className="chemical-hazardous-usage">{usageByType.pesticide.toFixed(2)} L</p>
                  </div>
                </div>
                <div className="graph-detail-box">
                  <h3 className="graph-subtitle">ปริมาณการใช้ของเหลว</h3>
                  {pieData.reduce((acc, d) => acc + d.value, 0) > 0 ? (
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
                      width={250}
                      height={130}
                    />
                  ) : (
                    <p>ไม่มีข้อมูลการใช้ของเหลว</p>
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </section>
      {modalMessage && (
        <div className="modal-overlay">
          <div className="modal-box">
            <button className="modal-close" onClick={closeModal}>×</button>
            <div className="crossmark-animation">
              <svg viewBox="0 0 52 52" className="crossmark">
                <circle className="crossmark-circle" cx="26" cy="26" r="25" fill="none" />
                <path className="crossmark-line1" d="M16 16 L36 36" />
                <path className="crossmark-line2" d="M36 16 L16 36" />
              </svg>
            </div>
            <p>{modalMessage}</p>
            <button className="modal-ok" onClick={closeModal}>ตกลง</button>
          </div>
        </div>
      )}
    </main>
  );
}