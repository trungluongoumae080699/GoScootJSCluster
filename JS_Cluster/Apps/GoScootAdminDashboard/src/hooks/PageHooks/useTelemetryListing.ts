import { useRef, useState } from "react";
import { useGlobalContext } from "../../context/GlobalContext";
import { FetchApiArgs, FetchResult, usePaginationList } from "../usePaginationListSimple";
import { BikeTelemetry } from "@trungthao/admin_dashboard_dto";

export type TelemetryFilterPayload = {
    bikeId: string
    from: string;
    to: string;

};

export function useTelemetryListing(bikeId: string, fetchApi: (args: FetchApiArgs<TelemetryFilterPayload>) => Promise<FetchResult<BikeTelemetry>>) {
    const globalContext = useGlobalContext();

    // ✅ this MUST be an array because your pagination hook expects T[]
    const [displayList, setDisplayList] = useState<BikeTelemetry[]>([]);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // ✅ Filters packed as payload
    const [filterPayload, setFilterPayload] = useState<TelemetryFilterPayload>({
        bikeId: bikeId,
        from: "",
        to: "",
    });

    // ✅ prev snapshot (no rerender)
    // If you want "Reset" to reset to the last applied snapshot,
    // you should update this ref when Apply is pressed (see below).
    const prevFilterPayload = useRef<TelemetryFilterPayload>(filterPayload);

    const { resetFilter, applyFilters, goToPage } = usePaginationList<BikeTelemetry, TelemetryFilterPayload>(
        displayList,
        setDisplayList,
        isLoading,
        setIsLoading,
        currentPage,
        setCurrentPage,
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
        // actions
        applyFilters, // use snapshot version
        resetFilter,
        goToPage,
        // filters
        filterPayload,
        setFilterPayload,
    };
}