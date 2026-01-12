export declare enum AlertType {
    TOPPLE = "topple",
    CRASH = "crash",
    LOW_BATTERY = "low_battery",
    BOUNDARY_CROSS = "boundary_cross"
}
export interface Alert {
    id: string;
    bike_id: string;
    content: string;
    type: AlertType;
    longitude: number;
    latitude: number;
    time: number;
}
