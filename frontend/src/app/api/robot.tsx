
export type SensorDataType = {
  battery: number;
  sprayRate: number;
  waterLevel: number;
  deviceStatus: "online" | "offline";
  pumpStatus: boolean;
};

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

function toThaiDatetimeString(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleString('th-TH', {
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}


export async function fetchLatestSensorData(robotId: number): Promise<RawSensorData[]> {
  const res = await fetch(`/robot/sensor-data/${robotId}/latest10`, {
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
  const res = await fetch('/robot/my-robot', {
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
  const data: Esp32DataType = {
    ...json.data,
    timestamp: toThaiDatetimeString(json.data.timestamp) 
  };

  return data;
}