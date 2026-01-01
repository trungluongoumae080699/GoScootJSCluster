import { createContext, Dispatch, SetStateAction, useContext, useState } from "react";
import { Alert } from "../../../../Packages/Admin_Dashboard_DTO/dist/Models/Alerts";

export enum WebScreen {
    DASHBOARD = "DASHBOARD",
    BIKES = "BIKES",
    BIKE_DETAIL = "BIKE_DETAIL",
    TRIPS = "TRIPS",
    TRIP_DETAIL = "TRIP_DETAIL",
    ALERT = "ALERT",
    LOGIN = "LOGIN",
}   

export type GlobalContextType = {
    alerts: Alert[];
    setAlerts: Dispatch<SetStateAction<Alert[]>>;
    alertCount: number;
    setAlertCount: Dispatch<SetStateAction<number>>;
    newAlerts: Alert[];
    setNewAlerts: Dispatch<SetStateAction<Alert[]>>;
    isAuth: boolean;
    setIsAuth: Dispatch<SetStateAction<boolean>>;
    isCheckingAuth: boolean;
    setIsCheckingAuth: Dispatch<SetStateAction<boolean>>;
    currentPage: WebScreen;
    setCurrentPage: Dispatch<SetStateAction<WebScreen>>;
    bikeCount: number,
    setBikeCount: Dispatch<SetStateAction<number>>
    
    
};
export const GlobalContext = createContext<GlobalContextType | undefined>(
    undefined
);

export function GlobalProvider({ children }: { children: React.ReactNode }) {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [newAlerts, setNewAlerts] = useState<Alert[]>([]);
    const [alertCount, setAlertCount] = useState<number>(0);
    const [isAuth, setIsAuth] = useState<boolean>(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
    const [currentPage, setCurrentPage] = useState<WebScreen>(WebScreen.DASHBOARD);
    const [bikeCount, setBikeCount] = useState<number>(0)
    const [selectedBikeLocation, setSelectedBikeLocation] = useState<
    [number, number] | null
  >(null);

    return (
        <GlobalContext.Provider
            value={{
                alerts,
                setAlerts,
                alertCount,
                setAlertCount,
                newAlerts,
                setNewAlerts,
                isAuth,
                setIsAuth,
                isCheckingAuth,
                setIsCheckingAuth,
                currentPage,
                setCurrentPage,
                bikeCount,
                setBikeCount
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
}
export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobalContext must be used within GlobalProvider");
  }
  return context;
};