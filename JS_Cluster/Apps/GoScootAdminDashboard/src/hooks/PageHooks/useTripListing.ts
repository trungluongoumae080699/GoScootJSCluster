import { useRef, useState } from "react";
import { useGlobalContext } from "../../context/GlobalContext";
import { FetchApiArgs, FetchResult, usePaginationList } from "../usePaginationListSimple";
import { Trip } from "@trungthao/admin_dashboard_dto";

export type TripFilterPayload = {
  status: string;
  bikeId: string;
  search: string;
  from: string; // timestamp ms
  to: string;   // timestamp ms
};

export function useTripListing(bikeId: string, fetchApi: (args: FetchApiArgs<TripFilterPayload>) => Promise<FetchResult<Trip>>) {
  const globalContext = useGlobalContext();

  // ✅ this MUST be an array because your pagination hook expects T[]
  const [displayList, setDisplayList] = useState<Trip[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ✅ Filters packed as payload
  const [filterPayload, setFilterPayload] = useState<TripFilterPayload>({
    search: "",
    bikeId: bikeId,
    status: "",
    from: "",
    to: "",
  });

  // ✅ prev snapshot (no rerender)
  // If you want "Reset" to reset to the last applied snapshot,
  // you should update this ref when Apply is pressed (see below).
  const prevFilterPayload = useRef<TripFilterPayload>(filterPayload);

  const { totalPages, resetFilter, applyFilters, goToPage } = usePaginationList<Trip, TripFilterPayload>(
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
    100
  );

  return {
    // state
    isLoading,
    displayList,
    totalCount,
    currentPage,
    totalPages,
    // actions
    applyFilters, // use snapshot version
    resetFilter,
    goToPage,
    // filters
    filterPayload,
    setFilterPayload,
  };
}