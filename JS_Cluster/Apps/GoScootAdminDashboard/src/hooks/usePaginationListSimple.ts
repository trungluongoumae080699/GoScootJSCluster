
import { Dispatch, RefObject, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BadRequestException, UnauthenticatedException } from "../models/Exceptions/ApiExceptions";
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
            if (!isLoading) return;

            console.log("Fetching...");

            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            try {
                const result = await fetchApi({
                    startPage: currentPage,
                    pageSize,
                    filter: filterPayload,
                    signal: controller.signal,
                });

                setDisplayList(result.data);
                setTotalCount(result.totalCount);
                // ⏱ delay 2 seconds
                await new Promise((resolve) => setTimeout(resolve, 2000));
                setIsLoading(false);
            }
            catch (err) {
                if (err instanceof UnauthenticatedException) {
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                    setIsLoading(false);
                    globalContext.setSnackbar({
                        message: "Phiên đăng nhập đã hết hạn. Xin vui lòng đăng nhập lại",
                        type: "Error",
                        isOn: true
                    })
                    globalContext.setIsAuth(false);

                } else if (err instanceof BadRequestException) {
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                    setIsLoading(false);
                    globalContext.setSnackbar({
                        message: err.message,
                        type: "Error",
                        isOn: true
                    })

                } else {
                    setIsLoading(false);
                    globalContext.setSnackbar({
                        message: "Đã xảy ra lỗi. Xin vui lòng thử lại",
                        type: "Error",
                        isOn: true
                    })
                }
            }


            finally {

            }
        };

        execute();
    }, [isLoading]);

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