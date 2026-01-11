import React, {
  createContext,
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useContext,
  useRef,
  useState,
} from "react";

import { Trip } from '@trungthao/admin_dashboard_dto';


export type TripManagementContextType = {
  currentTrip:  Trip | null;
  setCurrentTrip: Dispatch<SetStateAction<Trip | null>>;
  currentTripId: string | null
  setCurrentTripId: Dispatch<SetStateAction<string | null>>
};

export const TripManagementContext = createContext<TripManagementContextType | undefined>(
  undefined
);

export function TripManagementContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [currentTripId, setCurrentTripId] = useState<string | null>(null)


  return (
    <TripManagementContext.Provider
      value={{
        currentTrip,
        setCurrentTrip,
        currentTripId,
        setCurrentTripId
      }}
    >
      {children}
    </TripManagementContext.Provider>
  );
}

export const useTripManagementContext = (): TripManagementContextType => {
  const context = useContext(TripManagementContext);
  if (!context) {
    throw new Error(
      "Trip Management Context must be used within BikeManagementContextProvider"
    );
  }
  return context;
};