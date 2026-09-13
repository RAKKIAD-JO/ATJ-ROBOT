'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelectedRobot } from "@/app/contexts/SelectedRobotContext";
import {
  fetchSensorData,
  SensorDataType,
  fetchRobotData,
  Esp32DataType,
  fetchLatestSensorData,
  RawSensorData,
} from "../app/api/robot";
import DonutChart from "@/components/donutChart";
import Loading from "@/components/loading";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Home() {
  const { selectedRobot } = useSelectedRobot();
  const router = useRouter();
  const [sensorData, setSensorData] = useState<SensorDataType | null>(null);
  const [latest10Data, setLatest10Data] = useState<RawSensorData[]>([]);
  const [loadingSensor, setLoadingSensor] = useState(false);
  const [dataType, setDataType] = useState<Esp32DataType | null>(null);

  useEffect(() => {
    fetch("/api/users/profile", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (res.status === 403 || res.status === 401) {
          router.replace("/");
        }
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    if (!selectedRobot?.robot_id) {
      setSensorData(null);
      setDataType(null);
      setLatest10Data([]);
      return;
    }

    const loadAllData = async () => {
      setLoadingSensor(true);
      try {
        const [sensor, robotInfo, latest10] = await Promise.all([
          fetchSensorData(selectedRobot.robot_id).catch(() => null),
          fetchRobotData(selectedRobot.robot_id).catch(() => null),
          fetchLatestSensorData(selectedRobot.robot_id).catch(() => []),
        ]);

        if (sensor) setSensorData(sensor);
        if (robotInfo) setDataType(robotInfo);
        if (latest10) setLatest10Data(latest10);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoadingSensor(false);
      }
    };

    loadAllData();
    const intervalId = setInterval(loadAllData, 10000);
    return () => clearInterval(intervalId);
  }, [selectedRobot]);

  const batteryPercent = Number(sensorData?.battery) || 86;
  const totalVolume = Number(sensorData?.totalVolume) || 3.98;
  const waterLevelPercent = Number(sensorData?.waterLevel) || 68;
  const isRobotOnline = sensorData?.deviceStatus === "online";
  const isPumpOn = sensorData?.pumpStatus === "ON";

  // Prepare chart data from latest 10 telemetry
  const chartLabels =
    latest10Data.length > 0
      ? latest10Data.map((d) =>
          new Date(d.timestamp).toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
          })
        )
      : ["01:01", "01:02", "01:03", "01:04", "01:05", "01:06", "01:07", "01:08", "01:09", "01:10"];

  const batteryChartData =
    latest10Data.length > 0 ? latest10Data.map((d) => d.battery) : [99, 98, 96, 95, 94, 92, 90, 88, 87, 86];
  const volumeChartData =
    latest10Data.length > 0 ? latest10Data.map((d) => d.totalVolume) : [0.2, 0.6, 1.1, 1.6, 2.1, 2.6, 3.0, 3.4, 3.7, 3.98];
  const waterLvlChartData =
    latest10Data.length > 0 ? latest10Data.map((d) => d.waterLevel) : [98, 95, 93, 89, 86, 84, 80, 76, 72, 68];

  const mainChartConfig = {
    labels: chartLabels,
    datasets: [
      {
        label: "Battery Level",
        data: batteryChartData,
        borderColor: "#4ADE80",
        backgroundColor: "#4ADE80",
        tension: 0.3,
        borderWidth: 2.2,
        pointRadius: 3,
        yAxisID: "y",
      },
      {
        label: "Total Volume",
        data: volumeChartData,
        borderColor: "#3FA9E6",
        backgroundColor: "#3FA9E6",
        tension: 0.3,
        borderWidth: 2.2,
        pointRadius: 3,
        yAxisID: "y1",
      },
      {
        label: "Water Level",
        data: waterLvlChartData,
        borderColor: "#F0A93A",
        backgroundColor: "#F0A93A",
        tension: 0.3,
        borderWidth: 2.2,
        pointRadius: 3,
        yAxisID: "y",
      },
    ],
  };

  const chartOptions = {
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
        min: 0,
        max: 100,
        grid: { color: "rgba(255, 255, 255, 0.05)", drawTicks: false },
        border: { display: false },
        ticks: { color: "#8D9AAA" },
      },
      y1: {
        position: "right" as const,
        min: 0,
        max: 10,
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#3FA9E6" },
      },
    },
  };

  const [alertPrefs, setAlertPrefs] = useState({ lowBattery: true, lowWater: true });

  useEffect(() => {
    const saved = localStorage.getItem("atj_alert_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAlertPrefs({
          lowBattery: typeof parsed.lowBattery === "boolean" ? parsed.lowBattery : true,
          lowWater: typeof parsed.lowWater === "boolean" ? parsed.lowWater : true,
        });
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  if (loadingSensor && !sensorData) {
    return <Loading />;
  }

  return (
    <main className="content">
      {/* Alert Banners */}
      {alertPrefs.lowBattery && batteryPercent < 20 && (
        <div className="mb-4 p-3.5 rounded-lg bg-[var(--warn-soft)] text-[var(--warn)] border border-[var(--warn)] text-xs font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
          </svg>
          <span>⚠️ แจ้งเตือน: แบตเตอรี่หุ่นยนต์ต่ำกว่า 20% ({batteryPercent}%) - กรุณานำหุ่นยนต์เข้าชาร์จไฟ</span>
        </div>
      )}

      {alertPrefs.lowWater && waterLevelPercent < 15 && (
        <div className="mb-4 p-3.5 rounded-lg bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)] text-xs font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
          </svg>
          <span>⚠️ แจ้งเตือน: ระดับน้ำในถังฉีดพ่นต่ำกว่า 15% ({waterLevelPercent}%) - กรุณาเติมน้ำหรือสารเคมีเพิ่ม</span>
        </div>
      )}
      {/* Metric Cards Grid */}
      <div className="metric-grid">
        {/* Metric 1: Battery */}
        <div className="metric-card" style={{ "--m-color": "var(--good)", "--m-color-soft": "var(--good-soft)" } as React.CSSProperties}>
          <div className="metric-head">
            <div className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="2" y="7" width="17" height="10" rx="2" />
                <path d="M22 10.3v3.4" />
              </svg>
            </div>
            <div>
              <div className="metric-label">แบตเตอรี่</div>
              <div className="metric-sub">Total · ต่อเนื่อง</div>
            </div>
          </div>
          <div className="ring-wrap">
            <DonutChart
              label="แบตเตอรี่"
              value={Number(batteryPercent.toFixed(1))}
              color="#4ADE80"
              mode="remaining"
            />
          </div>
        </div>

        {/* Metric 2: Water Used */}
        <div className="metric-card" style={{ "--m-color": "#3FA9E6", "--m-color-soft": "#123549" } as React.CSSProperties}>
          <div className="metric-head">
            <div className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2.8s6.6 7 6.6 11.2a6.6 6.6 0 11-13.2 0c0-4.2 6.6-11.2 6.6-11.2z" />
              </svg>
            </div>
            <div>
              <div className="metric-label">น้ำที่ใช้ไป</div>
              <div className="metric-sub">Total Volume</div>
            </div>
          </div>
          <div className="plain-metric">
            <span className="num">{totalVolume.toFixed(2)}</span>
            <span className="unit">ลิตร</span>
          </div>
        </div>

        {/* Metric 3: Water Level */}
        <div className="metric-card" style={{ "--m-color": "var(--warn)", "--m-color-soft": "var(--warn-soft)" } as React.CSSProperties}>
          <div className="metric-head">
            <div className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2.8s6.6 7 6.6 11.2a6.6 6.6 0 11-13.2 0c0-4.2 6.6-11.2 6.6-11.2z" />
              </svg>
            </div>
            <div>
              <div className="metric-label">ระดับน้ำ</div>
              <div className="metric-sub">Total · ถังหลัก</div>
            </div>
          </div>
          <div className="ring-wrap">
            <DonutChart
              label="ระดับน้ำ"
              value={Number(waterLevelPercent.toFixed(1))}
              color="#F0A93A"
              mode="remaining"
            />
          </div>
        </div>

        {/* Metric 4: Device Status */}
        <div className="metric-card" style={{ "--m-color": "var(--text-mid)", "--m-color-soft": "var(--panel-raised)" } as React.CSSProperties}>
          <div className="metric-head">
            <div className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="4" y="8" width="16" height="12" rx="2" />
                <path d="M12 8V4M9 4h6" />
              </svg>
            </div>
            <div>
              <div className="metric-label">สถานะอุปกรณ์</div>
              <div className="metric-sub">Live control</div>
            </div>
          </div>
          <div className="toggle-metric">
            <div className="toggle-row">
              <span className="toggle-row-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="4" y="8" width="16" height="12" rx="2" />
                  <path d="M12 8V4M9 4h6" />
                </svg>
                หุ่นยนต์
              </span>
              <span className={`status-pill ${isRobotOnline ? "on" : "off"}`}>
                {isRobotOnline ? "ON" : "OFF"}
              </span>
            </div>
            <div className="toggle-row">
              <span className="toggle-row-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 2.8s6.6 7 6.6 11.2a6.6 6.6 0 11-13.2 0c0-4.2 6.6-11.2 6.6-11.2z" />
                </svg>
                ปั๊มน้ำ
              </span>
              <span className={`status-pill ${isPumpOn ? "on" : "off"}`}>
                {isPumpOn ? "ON" : "OFF"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart Panel + Info List */}
      <div className="grid-2col">
        {/* Chart Panel */}
        <div className="panel chart-panel">
          <div className="section-head">
            <div>
              <div className="section-title">กราฟแสดงสถานะ</div>
              <div className="section-sub">ค่าที่บันทึกล่าสุด 10 นาทีย้อนหลัง</div>
            </div>
          </div>
          <div className="legend-row">
            <div className="legend-item">
              <span className="legend-swatch" style={{ background: "var(--good)" }}></span>
              Battery Level
            </div>
            <div className="legend-item">
              <span className="legend-swatch" style={{ background: "#3FA9E6" }}></span>
              Total Volume
            </div>
            <div className="legend-item">
              <span className="legend-swatch" style={{ background: "var(--warn)" }}></span>
              Water Level
            </div>
          </div>
          <div className="chart-box">
            <Line data={mainChartConfig} options={chartOptions} />
          </div>
        </div>

        {/* Info List */}
        <div className="panel info-list">
          <div className="section-title" style={{ marginBottom: "10px" }}>
            ข้อมูลการฉีดพ่น
          </div>
          <div className="info-row">
            <span className="k">ชนิดพืช</span>
            <span className="v">{dataType?.plantType || "ข้าวโพด"}</span>
          </div>
          <div className="info-row">
            <span className="k">ประเภทของเหลว</span>
            <span className="v">{dataType?.liquidType || "ปุ๋ย"}</span>
          </div>
          <div className="info-row">
            <span className="k">ชื่อสารเคมี</span>
            <span className="v">{dataType?.chemicalName || "ปุ๋ยน้ำอินทรีย์ สูตรเร่งโต"}</span>
          </div>
          <div className="info-row">
            <span className="k">พื้นที่</span>
            <span className="v">{dataType?.area || "แปลง B2 (ริมห้วย)"}</span>
          </div>
          <div className="info-row">
            <span className="k">อื่นๆ</span>
            <span className="v">{dataType?.other || "รอบพ่นทดสอบที่ 1 ประจำวัน"}</span>
          </div>
          <div className="info-row">
            <span className="k">ระยะเวลาที่เริ่ม</span>
            <span className="v num">{dataType?.timestamp || "13/09/2569 01:01:00"}</span>
          </div>
        </div>
      </div>
    </main>
  );
}