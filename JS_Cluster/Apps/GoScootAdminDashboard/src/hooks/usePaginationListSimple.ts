
import { Dispatch, RefObject, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UnauthenticatedException } from "../models/Exceptions/ApiExceptions";
import { useGlobalContext } from "../context/GlobalContext";

export type PrefetchGroupPayload<T> = {
    data: T[];
    group: number;
};

export type FetchResult<T> = {
    data: T[];
    totalCount: number;
};

export type FetchApiArgs<F> = {
    startPage: number;          // first page of group (1, 6, 11, ...)
    pageSize: number;
    filter: F;
    signal?: AbortSignal;
};

export function usePaginationList<T, F>(
    displayList: T[],
    setDisplayList: Dispatch<SetStateAction<T[]>>,
    isLoading: boolean,
    setIsLoading: Dispatch<SetStateAction<boolean>>,
    currentPage: number,
    setCurrentPage: Dispatch<SetStateAction<number>>,
    totalCount: number,
    setTotalCount: Dispatch<SetStateAction<number>>,
    filterPayload: F,
    setFilterPayload: Dispatch<SetStateAction<F>>,
    prevFilterPayload: RefObject<F>,
    fetchApi: (args: FetchApiArgs<F>) => Promise<FetchResult<T>>,
    pageSize: number
) {
    const globalContext = useGlobalContext()
    const abortRef = useRef<AbortController | null>(null);


    useEffect(() => {
        const execute = async () => {
            if (isLoading) {
                console.log("Fetching...")
                abortRef.current?.abort();
                const controller = new AbortController();
                abortRef.current = controller;
                try {
                    const result = await fetchApi({
                        startPage: currentPage,
                        pageSize: pageSize,
                        filter: filterPayload,
                        signal: controller.signal
                    });
                    setDisplayList(result.data)
                    setTotalCount(result.totalCount)
                } catch (err) {
                    if (err instanceof UnauthenticatedException) {
                        globalContext.setIsAuth(false)
                    }
                } finally {
                    setIsLoading(false)
                }
            }


        }
        execute()
    }, [isLoading])

    const totalPages = useMemo(() => {
        if (totalCount === 0) return 1;
        return Math.ceil(totalCount / pageSize);
    }, [totalCount, pageSize]);

    // Apply = defines snapshot
    const applyFilters = useCallback(() => {
        setCurrentPage(1)
        setIsLoading(true)
    }, []);

    const resetFilter = useCallback(() => {
        setFilterPayload(prevFilterPayload.current)
        setCurrentPage(1)
        setIsLoading(true)
    }, []);

    const goToPage = useCallback(
        (page: number) => {
            setCurrentPage(page)
            setIsLoading(true)
        },
        []
    );

    return {
        totalPages,
        resetFilter,
        applyFilters,
        goToPage,
    };
}