import { useRef, useState } from "react";
import { useGlobalContext } from "../../context/GlobalContext";
import { FetchApiArgs, FetchResult, usePaginationList } from "../usePaginationListSimple";
import { Bike } from "@trungthao/admin_dashboard_dto";


export type BikeFilterPayload = {
  search: string;
  battery: string;
  status: string;
  operationStatus: string
};

export function useBikeListing(fetchApi: (args: FetchApiArgs<BikeFilterPayload>) => Promise<FetchResult<Bike>>) {
  const globalContext = useGlobalContext();

  // ✅ this MUST be an array because your pagination hook expects T[]
  const [displayList, setDisplayList] = useState<Bike[]>([]);

  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ✅ Filters packed as payload
  const [filterPayload, setFilterPayload] = useState<BikeFilterPayload>({
    search: "",
    battery: "",
    operationStatus: "",
    status: "",
  });

  // ✅ prev snapshot (no rerender)
  // If you want "Reset" to reset to the last applied snapshot,
  // you should update this ref when Apply is pressed (see below).
  const prevFilterPayload = useRef<BikeFilterPayload>(filterPayload);

  const { totalPages, resetFilter, applyFilters, goToPage } = usePaginationList<Bike, BikeFilterPayload>(
    displayList,
    setDisplayList,
    isLoading,
    setIsLoading,
    currentPage,
    setCurrentPage,
    totalCount,
    setTotalCount,
    filterPayload,
    setFilterPayload,
    prevFilterPayload,
    fetchApi,
    30
  );

  return {
    // state
    isLoading,
    displayList,
    totalPages,
    totalCount,
    currentPage,
    // actions
    applyFilters, // use snapshot version
    resetFilter,
    goToPage,
    // filters
    filterPayload,
    setFilterPayload,
  };
}