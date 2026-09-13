"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
  useEffect,
} from "react";

export type RobotInfo = {
  robot_id: number;               
  robot_name: string;       
  device_id: string;        
};

type SelectedRobotContextType = {
  selectedRobot: RobotInfo | null;
  setSelectedRobot: Dispatch<SetStateAction<RobotInfo | null>>;
  token: string;
  setToken: Dispatch<SetStateAction<string>>;
};

const SelectedRobotContext = createContext<SelectedRobotContextType | undefined>(undefined);

export const SelectedRobotProvider = ({ children }: { children: ReactNode }) => {
  const [selectedRobot, setSelectedRobot] = useState<RobotInfo | null>(null);
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    const getTokenFromCookie = (): string | null => {
    const cookieString = document.cookie;
    const tokenMatch = cookieString.match(/(?:^|;\s*)token=([^;]+)/);
    return tokenMatch ? tokenMatch[1] : null;
  };

  const cookieToken = getTokenFromCookie();
  if (cookieToken) {
    setToken(cookieToken);
  }

  fetch('/robot/my_robot', {
    method: "GET",
    credentials: "include"
  })
    .then(res => res.json())
    .then(data => {
      if (data.success && Array.isArray(data.robots) && data.robots.length > 0) {
        setSelectedRobot(prev => prev || data.robots[0]);
      }
    })
    .catch(() => {});
  }, []);

  return (
    <SelectedRobotContext.Provider value={{ selectedRobot, setSelectedRobot, token, setToken }}>
      {children}
    </SelectedRobotContext.Provider>
  );
};


export const useSelectedRobot = () => {
  const context = useContext(SelectedRobotContext);
  if (!context) {
    throw new Error("useSelectedRobot must be used within a SelectedRobotProvider");
  }
  return context;
};
