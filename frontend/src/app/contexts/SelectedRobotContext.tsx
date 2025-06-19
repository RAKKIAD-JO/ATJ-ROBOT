"use client"
import { createContext, useContext, useState, ReactNode } from "react";


export type RobotType = {
  id: string;
  robot_name: string;
  batteryLevel?: number;
  flowRate?: number;
  waterLevel?: number;
  robotStatus?: boolean;
  pumpStatus?: boolean;
};

export type SelectedRobotContextType = {
  selectedRobot: RobotType | null;
  setSelectedRobot: (robot: RobotType | null) => void;
};

export const SelectedRobotContext = createContext<SelectedRobotContextType | null>(null);

export function SelectedRobotProvider({ children }: { children: ReactNode }) {
  const [selectedRobot, setSelectedRobot] = useState<RobotType | null>(null);

  return (
    <SelectedRobotContext.Provider value={{ selectedRobot, setSelectedRobot }}>
      {children}
    </SelectedRobotContext.Provider>
  );
}

export const useSelectedRobot = () => {
  const context = useContext(SelectedRobotContext);
  if (!context) throw new Error("useSelectedRobot must be used within a SelectedRobotProvider");
  return context;
};
