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
import { PrefetchGroupPayload } from "../hooks/usePaginationList";

export type BikeFilterPayload = {
  search: string;
  battery: string;
  status: string;
  operationStatus: string
};

export type BikeManagementContextType = {
  currentBike: Bike | null;
  setCurrentBike: Dispatch<SetStateAction<Bike | null>>;

  // group list (<= 50)
  bikeList: Bike[];
  setBikeList: Dispatch<SetStateAction<Bike[]>>;

  // list đang hiển thị (<= 10)
  displayBikeList: Bike[];
  setDisplayBikeList: Dispatch<SetStateAction<Bike[]>>;

  // 1-group prefetch buffer (no rerender)
  prefetchedNextGroupRef: MutableRefObject<PrefetchGroupPayload<Bike> | null>;

  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;

  currentPageGroupIndexForDisplay: number;
  setCurrentPageGroupIndexForDisplay: Dispatch<SetStateAction<number>>;

  // does NOT trigger rerender when changed
  currentPageGroupIndexForFetch: MutableRefObject<number>;

  // total bikes matching current snapshot (server count)
  bikeCount: number;
  setBikeCount: Dispatch<SetStateAction<number>>;

  bikeFilterPayload: BikeFilterPayload;
  setBikeFilterPayload: Dispatch<SetStateAction<BikeFilterPayload>>;

  prevBikeFilterPayload: MutableRefObject<BikeFilterPayload>;
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

  const [bikeList, setBikeList] = useState<Bike[]>([]);
  const [displayBikeList, setDisplayBikeList] = useState<Bike[]>([]);

  const [bikeCount, setBikeCount] = useState<number>(0);

  const [currentPage, setCurrentPage] = useState<number>(1);

  const [currentPageGroupIndexForDisplay, setCurrentPageGroupIndexForDisplay] =
    useState<number>(0);

  // ✅ Filters packed as payload
  const [bikeFilterPayload, setBikeFilterPayload] = useState<BikeFilterPayload>({
    search: "",
    battery: "",
    operationStatus: "",
    status: "",
  });

  // ✅ prev snapshot (no rerender)
  const prevBikeFilterPayload = useRef<BikeFilterPayload>(bikeFilterPayload);

  // ✅ group fetch cursor (no rerender)
  const currentPageGroupIndexForFetch = useRef<number>(0);

  // ✅ 1-group prefetch buffer (no rerender)
  const prefetchedNextGroupRef = useRef<PrefetchGroupPayload<Bike> | null>(null);

  return (
    <BikeManagementContext.Provider
      value={{
        currentBike,
        setCurrentBike,

        bikeList,
        setBikeList,

        displayBikeList,
        setDisplayBikeList,

        prefetchedNextGroupRef,

        currentPage,
        setCurrentPage,

        currentPageGroupIndexForDisplay,
        setCurrentPageGroupIndexForDisplay,

        currentPageGroupIndexForFetch,

        bikeCount,
        setBikeCount,

        bikeFilterPayload,
        setBikeFilterPayload,

        prevBikeFilterPayload,
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