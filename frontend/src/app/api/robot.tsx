// type สำหรับข้อมูลปัจจุบันของ sensor (1 ค่า)
export type SensorDataType = {
  battery: number;
  sprayRate: number;
  waterLevel: number;
  deviceStatus: "online" | "offline";
  pumpStatus: boolean;
};

// type สำหรับข้อมูลล่าสุด 10 ค่า (มี timestamp)
export type RawSensorData = {
  battery: number;
  sprayRate: number;
  waterLevel: number;
  timestamp: string;
};

export type Esp32DataType = {
  plantType: string;
  liquidType: string;
  chemicalName: string;
  chemicalAmount: string;
  area: string;
  other: string;
  timestamp: string;
};

export async function fetchLatestSensorData(deviceId: string): Promise<RawSensorData[]> {
  const res = await fetch(`/robot/sensor-data/${deviceId}/latest10`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error("Failed to fetch sensor data");
  }
  const data: RawSensorData[] = await res.json();
  return data;
}

export async function fetchMyRobots() {
  const res = await fetch('/robot/my-robots', {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch robots');
  return res.json();
}

export async function fetchSensorData(robotId: number): Promise<SensorDataType> {
  const res = await fetch(`/robot/sensor-data/${robotId}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Failed to fetch sensor data');
  return res.json();
}

export async function fetchRobotData(robotId: number): Promise<Esp32DataType> {
  const res = await fetch(`/robot/robot-data/${robotId}/latest`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch robot data');
  const json = await res.json();
  return json.data;
}