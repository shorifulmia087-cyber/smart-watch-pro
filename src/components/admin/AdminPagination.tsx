import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toBengaliNum } from '@/lib/bengali';

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

const AdminPagination = ({
  currentPage, totalPages, totalItems, pageSize,
  onPageChange, onPageSizeChange, pageSizeOptions = [15, 30, 50, 100],
}: AdminPaginationProps) => {
  if (totalPages <= 0 && !onPageSizeChange) return null;

  const startItem = totalItems === 0 ? 0 : currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalItems);

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(0);
    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages - 2, currentPage + 1);
    if (start > 1) pages.push('ellipsis');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages - 1);
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-border/30">
      {/* Left: Info + page size */}
      <div className="flex items-center gap-4">
        <p className="text-xs text-muted-foreground tabular-nums">
          মোট <span className="font-semibold text-foreground">{toBengaliNum(totalItems)}</span> এর মধ্যে{' '}
          <span className="font-semibold text-foreground">{toBengaliNum(startItem)}–{toBengaliNum(endItem)}</span> দেখানো হচ্ছে
        </p>
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground/70">দেখুন:</span>
            <select
              value={pageSize}
              onChange={e => onPageSizeChange(Number(e.target.value))}
              className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{toBengaliNum(size)} টি</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Pagination controls — reference image style */}
      {totalPages > 1 && (
        <div className="inline-flex items-center border border-border rounded-lg overflow-hidden bg-background shadow-sm">
          {/* Previous */}
          <button
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="flex items-center gap-1.5 px-3 h-10 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-r border-border"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Page numbers */}
          {getPageNumbers().map((p, i) =>
            p === 'ellipsis' ? (
              <span
                key={`e-${i}`}
                className="w-10 h-10 flex items-center justify-center text-muted-foreground/50 text-sm border-r border-border select-none"
              >
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-10 h-10 text-sm font-semibold transition-colors border-r border-border ${
                  currentPage === p
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted/50 hover:text-primary'
                }`}
              >
                {toBengaliNum(p + 1)}
              </button>
            )
          )}

          {/* Next */}
          <button
            onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            className="flex items-center gap-1.5 px-3 h-10 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminPagination;
