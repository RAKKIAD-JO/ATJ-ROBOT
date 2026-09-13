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

type SensorData = {
  battery: number;
  flow: number;
  water: number;
  time: string;
  totalVolume: number;
};

type Props = {
  deviceId: number;
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

    let intervalId: NodeJS.Timeout;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const sensorList: RawSensorData[] = await fetchLatestSensorData(deviceId);
        const formattedData = sensorList.map((item) => {
          const date = new Date(item.timestamp);
          const timeStr = date.toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "UTC"
          });
          return {
            battery: item.battery,
            flow: item.sprayRate,
            water: item.waterLevel,
            totalVolume: item.totalVolume,
            time: timeStr,
          };
        });

        setData(formattedData);
      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Error loading data");
        }
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (deviceId) {
      loadData();
      intervalId = setInterval(() => {
        loadData();
      }, 30000);
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [deviceId]);

  if (loading) return <div className="text-xs text-gray-500 py-4 text-center">Loading chart...</div>;
  if (error) return <div className="text-xs text-red-500 py-4 text-center">{error}</div>;
  if (data.length === 0) return <div className="text-xs text-gray-400 py-4 text-center">No data available</div>;

  return (
    <div className="w-full h-52">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
          <XAxis dataKey="time" label={{ value: "Time", position: "insideBottomRight", offset: -5 }} />
          <YAxis label={{ value: "Value", angle: -90, position: "insideLeft" }} />
          <Tooltip />
          <Legend verticalAlign="top" height={36} />
          <Line type="monotone" dataKey="battery" stroke="#28a745" strokeWidth={2} name="Battery Level" />
          <Line type="monotone" dataKey="totalVolume" stroke="#17a2b8" strokeWidth={2} name="Total Volume" />
          <Line type="monotone" dataKey="water" stroke="#f5732dff" strokeWidth={2} name="Water Level" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SystemChart;