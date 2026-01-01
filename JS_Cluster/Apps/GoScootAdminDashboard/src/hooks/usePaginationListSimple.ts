
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
    setTotalCount: Dispatch<SetStateAction<number>>,
    filterPayload: F,
    setFilterPayload: Dispatch<SetStateAction<F>>,
    prevFilterPayload: RefObject<F>,
    fetchApi: (args: FetchApiArgs<F>) => Promise<FetchResult<T>>
) {
    const globalContext = useGlobalContext()
    const ITEMS_PER_PAGE = 10;
    const abortRef = useRef<AbortController | null>(null);


    useEffect(() => {
        const execute = async () => {
            if (isLoading) {
                abortRef.current?.abort();
                const controller = new AbortController();
                abortRef.current = controller;
                try {
                    const result = await fetchApi({
                        startPage: currentPage,
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


    // Apply = defines snapshot
    const applyFilters = useCallback(() => {
       setIsLoading(true)
    }, []);

    const resetFilter = useCallback(() => {
    setFilterPayload(prevFilterPayload.current)
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
        resetFilter,
        applyFilters,
        goToPage,
    };
}