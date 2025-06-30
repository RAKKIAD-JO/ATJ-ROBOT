'use client';

import { useEffect, useState  } from "react";
import { useRouter } from "next/navigation";
import { useSelectedRobot } from "@/app/contexts/SelectedRobotContext";
import "@/styles/home.css";
import 'animate.css';
import SystemChart from "@/components/SystemChart";
import { fetchSensorData , SensorDataType ,fetchRobotData ,Esp32DataType } from "../app/api/robot"; 
import DonutChart from "@/components/donutChart";

interface User {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  profileImage: string;
  isAdmin: boolean;
}

export default function Home() {
    const { selectedRobot, token } = useSelectedRobot();
    const router = useRouter();
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [sensorData, setSensorData] = useState<SensorDataType | null>(null);
    const [loadingSensor, setLoadingSensor] = useState(false);
    const [loadingDataType, setLoadingDataType] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [dataType, setDataType] = useState<Esp32DataType | null>(null);

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
        .catch((err) => {
            setErrorMessage("เกิดข้อผิดพลาดในการดึงข้อมูล: " + err.message);
        });
    }, [router]);

    useEffect(() => {
      if (!selectedRobot?.id) {
        setSensorData(null);
        setDataType(null);
        return;
      }

      // โหลดข้อมูลเซ็นเซอร์
      const loadSensor = async () => {
        setLoadingSensor(true);
        setError(null);
        try {
          const data = await fetchSensorData(selectedRobot.id);
          setSensorData(data);
          
        } catch (err: unknown) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("เกิดข้อผิดพลาดในการโหลดข้อมูลเซ็นเซอร์");
          }
          setSensorData(null);
        } finally {
          setLoadingSensor(false);
        }
      };

      // โหลดข้อมูลชนิดพืช/ของเหลว ฯลฯ
      const loadDataType = async () => {
        setLoadingDataType(true);
        setError(null);
        try {
          const data = await fetchRobotData(selectedRobot.id);
          setDataType(data);
        } catch (err: unknown) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("เกิดข้อผิดพลาดในการโหลดข้อมูลชนิดพืช");
          }
          setDataType(null);
        } finally {
          setLoadingDataType(false);
        }
      };

      loadSensor();
      loadDataType();
    }, [selectedRobot, token]);

  const batteryPercent = Number(sensorData?.battery) || 0;
  const flowRatePercent = Number(sensorData?.sprayRate) || 0;
  const waterLevelPercent = Number(sensorData?.waterLevel) || 0;

    return (
    <main className='main-home'>
      <div className="dashboard">
        <h1>Dashboard</h1>

        {!selectedRobot ? (
          <p>โปรดเลือกหุ่นยนต์ของคุณ</p>
        ) : loadingSensor ? (
          <p>กำลังโหลดข้อมูล...</p>
        ) : loadingDataType ? (
          <p>กำลังโหลดข้อมูล...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : !sensorData ? (
          <p>ยังไม่มีข้อมูล sensor สำหรับหุ่นยนต์นี้</p>
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

            <div className="card-container">

              <div className="card">
                <div className="battery-header-icons">
                  <span className="material-symbols-outlined">battery_android_bolt</span>
                </div>
                <div className="box-battery">
                  <div className="battery-text">
                    <p>แบตเตอรี่</p>
                    <p>Total</p>
                  </div>
                  <div className="batter-value">
                    <DonutChart label="แบตเตอรี่" value={batteryPercent} color="rgba(0, 200, 83, 0.7)" mode="remaining"/>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flow-water-header-icons">
                  <span className="material-symbols-outlined">water</span>
                </div>
                <div className="box-flow-water">
                  <div className="flow-water-text">
                    <p>อัตราการไหล</p>
                    <p>Total</p>
                  </div>
                  <div className="flow-water-value">
                    <DonutChart label="อัตราไหล" value={flowRatePercent} color="rgba(54, 162, 235, 0.7)" mode="usage"/>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="leval-water-header-icons">
                  <span className="material-symbols-outlined">water_drop</span>
                </div>
                <div className="box-leval-water">
                  <div className="leval-water-text">
                    <p>ระดับน้ำ</p>
                    <p>Total</p>
                  </div>
                  <div className="leval-water-value">
                    <DonutChart label="ระดับน้ำ" value={waterLevelPercent} color="rgba(255, 193, 7, 0.7)" mode="remaining"/>
                  </div>
                </div>
              </div>

              <div className="card status-card">
                <div className="status-header">
                  <div className="status-item">
                    <span className="material-symbols-outlined robot-icon">smart_toy</span>
                    <div className="status-info">
                      <p>หุ่นยนต์</p>
                      <div className="robot-state">{sensorData.deviceStatus === "online" ? "ON" : "OFF"}</div>
                    </div>
                  </div>

                  <div className="status-item">
                    <span className="material-symbols-outlined pump-icon">water_pump</span>
                    <div className="status-info">
                      <p>ปั๊มน้ำ</p>
                      <div className="pump-state">{sensorData.pumpStatus ? "ON" : "OFF"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* กราฟ และข้อมูลการฉีดพ่น */}
            <div className="graph-box">
              <div className="haeder-graph-contens">
                <div className="graph-contens">
                  <h2>กราฟแสดงสถานะ</h2>
                  <SystemChart deviceId={selectedRobot.id} />
                </div>

                <div className="data">
                  <h2>ข้อมูลการฉีดพ่น</h2>
                  <div className="sub-data">
                    <p>ชนิดพืช : {dataType?.plantType}</p>
                    <p>ประเภทของของเหลว : {dataType?.liquidType}</p>
                    <p>ชื่อสารเคมี : {dataType?.chemicalName}</p>
                    <p>ปริมาณการใช้สารเคมี : {dataType?.chemicalAmount}</p>
                    <p>พื้นที่ : {dataType?.area}</p>
                    <p>ระยะเวลาที่เริ่ม : {dataType?.timestamp}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        {errorMessage && <div className="error-message">{errorMessage}</div>}
      </div>
    </main>
  );
}