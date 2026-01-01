import React, { useEffect, useState } from "react";
import "./pagination.css"

type PaginationProps = {
  currentPage: number;
  totalItems: number; // nếu chưa biết, bạn có thể truyền 1 hoặc NaN tuỳ logic
  goToPage: (page: number) => void | Promise<void>;
  isLoading?: boolean;
  className?: string;
};

export default function Pagination({
  currentPage,
  totalItems,
  goToPage,
  isLoading = false,
  className,
}: PaginationProps) {
  const [pageInput, setPageInput] = useState<string>(String(currentPage));
  const totalPages = totalItems === 0 ? 1 : (totalItems + 9) / 10

  // sync input mỗi khi currentPage đổi (bấm nút, fetch xong, v.v.)
  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const canGoPrev = currentPage > 1 && !isLoading;
  const canGoNext =
    Number.isFinite(totalPages) ? currentPage < totalPages && !isLoading : !isLoading;

  const commit = async () => {
    const page = Number(pageInput);
    if (Number.isNaN(page)) return;

    // clamp nếu totalPages là số hữu hạn
    if (Number.isFinite(totalPages)) {
      const clamped = Math.min(Math.max(page, 1), totalPages);
      await goToPage(clamped);
      return;
    }

    // nếu totalPages chưa biết => chỉ clamp min 1
    await goToPage(Math.max(page, 1));
  };

  return (
    <div className={`pagination ${className ?? ""}`}>
      <button
        className="pagination-btn"
        onClick={() => goToPage(1)}
        disabled={!canGoPrev}
        title="First page"
      >
        «
      </button>

      <button
        className="pagination-btn"
        onClick={() => goToPage(currentPage - 1)}
        disabled={!canGoPrev}
        title="Previous page"
      >
        ‹
      </button>

      <span className="pagination-info">
        Page{" "}
        <input
          type="text"
          value={pageInput}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "" || /^\d+$/.test(v)) setPageInput(v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
          }}
          onBlur={() => {
            // nếu user bỏ focus mà không enter => reset về currentPage
            setPageInput(String(currentPage));
          }}
          className="page-input"
          title="Enter page number and press Enter"
          disabled={isLoading}
        />{" "}
        of {Number.isFinite(totalPages) ? totalPages : "?"}
      </span>

      <button
        className="pagination-btn"
        onClick={() => goToPage(currentPage + 1)}
        disabled={!canGoNext}
        title="Next page"
      >
        ›
      </button>

      <button
        className="pagination-btn"
        onClick={() => Number.isFinite(totalPages) && goToPage(totalPages)}
        disabled={!Number.isFinite(totalPages) || !canGoNext}
        title="Last page"
      >
        »
      </button>
    </div>
  );
}