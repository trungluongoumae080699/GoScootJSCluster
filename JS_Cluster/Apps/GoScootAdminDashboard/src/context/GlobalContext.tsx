import { createContext, Dispatch, MutableRefObject, SetStateAction, useContext, useEffect, useRef, useState } from "react";
import { Alert } from "../../../../Packages/Admin_Dashboard_DTO/dist/Models/Alerts";

export type SnackbarConfig = {
    message: string,
    type: "Waiting" | "Error" | "Success",
    isOn: boolean
}
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
    currentHeader: string,
    setCurrentHeader: Dispatch<SetStateAction<string>>
    alerts: Alert[];
    setAlerts: Dispatch<SetStateAction<Alert[]>>;
    alertsReserve: MutableRefObject<Alert[]>
    alertCount: number;
    activeAlertId: string;
    setActiveAlertId: Dispatch<SetStateAction<string>>;
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
    snackbar: SnackbarConfig
    setSnackbar: Dispatch<SetStateAction<SnackbarConfig>>


};
export const GlobalContext = createContext<GlobalContextType | undefined>(
    undefined
);

export function GlobalProvider({ children }: { children: React.ReactNode }) {
    const [currentHeader, setCurrentHeader] = useState<string>("")
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [newAlerts, setNewAlerts] = useState<Alert[]>([]);
    const alertsReserve = useRef<Alert[]>([])
    const [alertCount, setAlertCount] = useState<number>(0);
    const [activeAlertId, setActiveAlertId] = useState<string>("");
    const [isAuth, setIsAuth] = useState<boolean>(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
    const [currentPage, setCurrentPage] = useState<WebScreen>(WebScreen.DASHBOARD);
    const [bikeCount, setBikeCount] = useState<number>(0)
    const [snackbar, setSnackbar] = useState<SnackbarConfig>({
        message: "This is a test",
        type: "Success",
        isOn: false
    })


    return (
        <GlobalContext.Provider
            value={{
                currentHeader,
                setCurrentHeader,
                alerts,
                setAlerts,
                alertsReserve,
                activeAlertId,
                setActiveAlertId,
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
                setBikeCount,
                snackbar,
                setSnackbar
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