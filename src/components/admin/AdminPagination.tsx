import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
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
  if (totalPages <= 1 && !onPageSizeChange) return null;

  const startItem = totalItems === 0 ? 0 : currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalItems);

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-border/30 bg-muted/5">
      {/* Left: Item count + page size selector */}
      <div className="flex items-center gap-4">
        <p className="text-xs text-muted-foreground font-medium tabular-nums">
          মোট {toBengaliNum(totalItems)} এর মধ্যে {toBengaliNum(startItem)}–{toBengaliNum(endItem)} দেখানো হচ্ছে
        </p>
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground/70">প্রতি পেইজে:</span>
            <select
              value={pageSize}
              onChange={e => onPageSizeChange(Number(e.target.value))}
              className="bg-muted/30 border border-border/40 rounded-md px-2.5 py-1.5 text-xs font-semibold text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all appearance-none pr-6"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 6px center',
              }}
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{toBengaliNum(size)} টি</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(0)}
            disabled={currentPage === 0}
            className="w-9 h-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-gold hover:bg-gold/5 disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-all duration-200 border border-transparent hover:border-gold/15"
            title="প্রথম পৃষ্ঠা"
          >
            <ChevronsLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>

          <button
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="w-9 h-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-gold hover:bg-gold/5 disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-all duration-200 border border-transparent hover:border-gold/15"
            title="পূর্ববর্তী"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>

          <div className="flex items-center gap-1 mx-1.5">
            {getPageNumbers().map((p, i) =>
              p === 'ellipsis' ? (
                <span key={`e-${i}`} className="w-9 h-9 flex items-center justify-center text-muted-foreground/40 text-sm select-none">
                  ···
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`w-9 h-9 rounded-md text-sm font-bold transition-all duration-200 ${
                    currentPage === p
                      ? 'gradient-gold text-white shadow-[0_3px_10px_-3px_hsl(var(--gold)/0.5)]'
                      : 'text-muted-foreground hover:text-gold hover:bg-gold/5 border border-transparent hover:border-gold/20'
                  }`}
                >
                  {toBengaliNum(p + 1)}
                </button>
              )
            )}
          </div>

          <button
            onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            className="w-9 h-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-gold hover:bg-gold/5 disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-all duration-200 border border-transparent hover:border-gold/15"
            title="পরবর্তী"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          </button>

          <button
            onClick={() => onPageChange(totalPages - 1)}
            disabled={currentPage >= totalPages - 1}
            className="w-9 h-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-gold hover:bg-gold/5 disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-all duration-200 border border-transparent hover:border-gold/15"
            title="শেষ পৃষ্ঠা"
          >
            <ChevronsRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminPagination;
