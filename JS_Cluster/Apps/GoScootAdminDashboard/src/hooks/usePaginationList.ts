
import { Dispatch, MutableRefObject, RefObject, SetStateAction, useCallback, useMemo, useRef, useState } from "react";
import { BikeFilterPayload } from "../context/BikeManagementContext";
import { UnauthenticatedException } from "../models/Exceptions/ApiExceptions";
import { useGlobalContext } from "../context/GlobalContext";

export type PrefetchGroupPayload<T> = {
    data: T[];
    group: number;
};

export type FetchResult<T> = {
    data: T[];
    totalCount?: number | null;
};

export type FetchApiArgs<F> = {
    startPage: number;          // first page of group (1, 6, 11, ...)
    withTotalCount: boolean;    // true only when filter changes / Apply
    filter: F;
    signal?: AbortSignal;
};

export function usePaginationList<T, F>(
    displayList: T[],
    setDisplayList: Dispatch<SetStateAction<T[]>>,
    list: T[],
    setList: Dispatch<SetStateAction<T[]>>,
    prefetchList: RefObject<PrefetchGroupPayload<T> | null>,
    currentPage: number,
    setCurrentPage: Dispatch<SetStateAction<number>>,
    currentGroupIndex: RefObject<number>,
    totalCount: number,
    setTotalCount: Dispatch<SetStateAction<number>>,
    filterPayload: F,
    setFilterPayload: Dispatch<SetStateAction<F>>,
    prevFilterPayload: RefObject<F>,
    fetchApi: (args: FetchApiArgs<F>) => Promise<FetchResult<T>>
) {
    const globalContext = useGlobalContext()
    const ITEMS_PER_PAGE = 10;
    const PAGES_PER_GROUP = 5;

    const [isLoading, setIsLoading] = useState(false);

    const abortRef = useRef<AbortController | null>(null);

    const fetchGroup = async (args: FetchApiArgs<F>) => {
        // cancel previous request
        abortRef.current?.abort();

        const controller = new AbortController();
        abortRef.current = controller;

        const result = await fetchApi({
            ...args,
            signal: controller.signal,

        });
        return result


    };

    const totalPages = useMemo(() => {
        // if you don't know totalCount yet, don't hard-block navigation
        if (!totalCount || totalCount <= 0) return Infinity;
        return Math.ceil(totalCount / ITEMS_PER_PAGE);
    }, [totalCount]);

    const getGroupIndex = (page: number) => Math.floor((page - 1) / PAGES_PER_GROUP);
    const getGroupStartPage = (group: number) => group * PAGES_PER_GROUP + 1;
    const getFirstPageOfGroup = (group: number) => group * PAGES_PER_GROUP + 1;

    const slicePageFromGroupList = useCallback(
        (page: number, groupList: T[], firstPageOfGroup: number) => {
            const offsetInGroup = page - firstPageOfGroup; // 0..4
            const from = offsetInGroup * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE;
            setDisplayList(groupList.slice(from, to));
        },
        [setDisplayList]
    );

    const maybePrefetchNextGroup = useCallback(
        async (page: number, groupIndex: number) => {
            const isLastPageInGroup = page % PAGES_PER_GROUP === 0;
            if (!isLastPageInGroup) return;

            const nextGroup = groupIndex + 1;
            const nextStartPage = getGroupStartPage(nextGroup);

            // don't prefetch beyond last page
            if (totalPages !== Infinity && nextStartPage > totalPages) return;

            // already prefetched
            if (prefetchList.current?.group === nextGroup) return;

            try {
                const res = await fetchGroup({
                    startPage: nextStartPage,
                    withTotalCount: false,
                    filter: filterPayload,
                });
                prefetchList.current = { group: nextGroup, data: res.data };
            } catch (err) {
                if (err instanceof UnauthenticatedException) {
                    globalContext.setIsAuth(false)
                }
            }

        },
        [fetchApi, filterPayload, prefetchList, totalPages]
    );

    // Apply = defines snapshot
    const applyFilters = useCallback(async () => {
        const prev = JSON.stringify(prevFilterPayload.current);
        const next = JSON.stringify(filterPayload);
        const changed = prev !== next;

        prevFilterPayload.current = filterPayload;

        setIsLoading(true);
        prefetchList.current = null;

        // reset paging
        currentGroupIndex.current = 0;
        setCurrentPage(1);

        try {
            const res = await fetchGroup({
                startPage: 1,
                withTotalCount: changed,
                filter: filterPayload,
            });
            console.log(res)
            setList(res.data);
            slicePageFromGroupList(1, res.data, 1);

            if (changed && typeof res.totalCount === "number") {
                setTotalCount(res.totalCount);
            }


        } catch (err) {
            if (err instanceof UnauthenticatedException) {
                globalContext.setIsAuth(false)
            }
        } finally {
            setIsLoading(false);
        }



    }, [
        fetchApi,
        filterPayload,
        prevFilterPayload,
        setCurrentPage,
        setList,
        setTotalCount,
        slicePageFromGroupList,
        currentGroupIndex,
        prefetchList,
    ]);

    const goToPage = useCallback(
        async (page: number) => {
            if (page < 1) return;
            if (totalPages !== Infinity && page > totalPages) return;

            const targetGroup = getGroupIndex(page);
            const firstPageOfTargetGroup = getFirstPageOfGroup(targetGroup);

            // same group -> just slice
            if (targetGroup === currentGroupIndex.current) {
                setCurrentPage(page);
                slicePageFromGroupList(page, list, firstPageOfTargetGroup);
                await maybePrefetchNextGroup(page, targetGroup);
                return;
            }

            // different group
            setIsLoading(true);

            // use prefetched group if available
            if (prefetchList.current?.group === targetGroup) {
                const groupData = prefetchList.current.data;

                setList(groupData);
                setCurrentPage(page);
                slicePageFromGroupList(page, groupData, firstPageOfTargetGroup);

                currentGroupIndex.current = targetGroup;
                prefetchList.current = null;

                setIsLoading(false);

                await maybePrefetchNextGroup(page, targetGroup);
                return;
            }

            try {
                const res = await fetchGroup({
                    startPage: getGroupStartPage(targetGroup),
                    withTotalCount: false,
                    filter: filterPayload,
                });

                setList(res.data);
                setCurrentPage(page);
                slicePageFromGroupList(page, res.data, firstPageOfTargetGroup);
                currentGroupIndex.current = targetGroup;
                prefetchList.current = null;
                setIsLoading(false);
                await maybePrefetchNextGroup(page, targetGroup);
            } catch (err) {
                if (err instanceof UnauthenticatedException) {
                    globalContext.setIsAuth(false)
                }
            }


        },
        [
            totalPages,
            list,
            setList,
            setCurrentPage,
            currentGroupIndex,
            filterPayload,
            fetchApi,
            prefetchList,
            slicePageFromGroupList,
            maybePrefetchNextGroup,
        ]
    );

    return {
        // state
        isLoading,
        totalPages,

        // actions
        applyFilters,
        goToPage,

        // filters (you passed setters in, so expose if you want)
        filterPayload,
        setFilterPayload,
    };
}