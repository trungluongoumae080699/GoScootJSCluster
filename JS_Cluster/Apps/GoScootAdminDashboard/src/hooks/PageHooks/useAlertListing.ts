import { useRef, useState } from "react";
import { useGlobalContext } from "../../context/GlobalContext";
import { FetchApiArgs, FetchResult, usePaginationList } from "../usePaginationListSimple";
import { Alert } from "../../../../../Packages/Admin_Dashboard_DTO/dist/Models/Alerts";

export type AlertFilterPayload = {
  search: string;
  from: string; // timestamp ms
  to: string;   // timestamp ms
  type: string;
};

export function useAlertListing(fetchApi: (args: FetchApiArgs<AlertFilterPayload>) => Promise<FetchResult<Alert>>) {
  const globalContext = useGlobalContext();

  // ✅ this MUST be an array because your pagination hook expects T[]
  const [displayList, setDisplayList] = useState<Alert[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ✅ Filters packed as payload
  const [filterPayload, setFilterPayload] = useState<AlertFilterPayload>({
    search: "",
    from: "",
    to: "",
    type: ""
  });

  // ✅ prev snapshot (no rerender)
  // If you want "Reset" to reset to the last applied snapshot,
  // you should update this ref when Apply is pressed (see below).
  const prevFilterPayload = useRef<AlertFilterPayload>(filterPayload);

  const { totalPages, resetFilter, applyFilters, goToPage } = usePaginationList<Alert, AlertFilterPayload>(
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
      totalPages,
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