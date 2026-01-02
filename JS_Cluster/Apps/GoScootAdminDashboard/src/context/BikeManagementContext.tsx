import React, {
  createContext,
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useContext,
  useRef,
  useState,
} from "react";

import { Bike } from "@trungthao/admin_dashboard_dto";


export type BikeManagementContextType = {
  currentBike: Bike | null;
  setCurrentBike: Dispatch<SetStateAction<Bike | null>>;
  currentBikeId: string | null
  setCurrentBikeId: Dispatch<SetStateAction<string | null>>
};

export const BikeManagementContext = createContext<BikeManagementContextType | undefined>(
  undefined
);

export function BikeManagementContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentBike, setCurrentBike] = useState<Bike | null>(null);
  const [currentBikeId, setCurrentBikeId] = useState<string | null>(null)


  return (
    <BikeManagementContext.Provider
      value={{
        currentBike,
        setCurrentBike,
        currentBikeId,
        setCurrentBikeId
      }}
    >
      {children}
    </BikeManagementContext.Provider>
  );
}

export const useBikeManagementContext = (): BikeManagementContextType => {
  const context = useContext(BikeManagementContext);
  if (!context) {
    throw new Error(
      "useBikeManagementContext must be used within BikeManagementContextProvider"
    );
  }
  return context;
};