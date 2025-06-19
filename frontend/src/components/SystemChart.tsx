"use client";

import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { fetchLatestSensorData, RawSensorData } from "../app/api/robot";
import "@/styles/SystemChart.css";

type SensorData = {
  battery: number;
  flow: number;
  water: number;
  time: string;
};

type Props = {
  deviceId: string | number;
};

const SystemChart = ({ deviceId }: Props) => {
  const [data, setData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deviceId) {
      setData([]);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const sensorList: RawSensorData[] = await fetchLatestSensorData(deviceId.toString());
        console.log("Fetched sensor list:", sensorList); 
        const formattedData = sensorList.map((item) => {
          const date = new Date(item.timestamp);
          const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          return {
            battery: item.battery,
            flow: item.sprayRate,
            water: item.waterLevel,
            time: timeStr,
          };
        });

        setData(formattedData);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Error loading data");
        }
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [deviceId]);

  if (loading) return <div>Loading chart...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (data.length === 0) return <div>No data available</div>;

  return (
    <div className="chart-container" style={{ width: "100%", height: 200 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
          <XAxis dataKey="time" label={{ value: "Time", position: "insideBottomRight", offset: -5 }} />
          <YAxis label={{ value: "Value", angle: -90, position: "insideLeft" }} />
          <Tooltip />
          <Legend verticalAlign="top" height={36} />
          <Line type="monotone" dataKey="battery" stroke="#ff7300" strokeWidth={2} name="Battery Level" />
          <Line type="monotone" dataKey="flow" stroke="#387908" strokeWidth={2} name="Flow Rate" />
          <Line type="monotone" dataKey="water" stroke="#8884d8" strokeWidth={2} name="Water Level" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SystemChart;
