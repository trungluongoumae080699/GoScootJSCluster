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


  return (
    <BikeManagementContext.Provider
      value={{
        currentBike,
        setCurrentBike,
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