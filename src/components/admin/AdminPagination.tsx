import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { toBengaliNum } from '@/lib/bengali';

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const AdminPagination = ({ currentPage, totalPages, totalItems, pageSize, onPageChange }: AdminPaginationProps) => {
  if (totalPages <= 1) return null;

  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalItems);

  // Generate visible page numbers with ellipsis
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
      return pages;
    }

    // Always show first page
    pages.push(0);

    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages - 2, currentPage + 1);

    if (start > 1) pages.push('ellipsis');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 2) pages.push('ellipsis');

    // Always show last page
    pages.push(totalPages - 1);
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-border/30 bg-muted/5">
      {/* Item count */}
      <p className="text-[11px] text-muted-foreground font-medium tabular-nums">
        মোট {toBengaliNum(totalItems)} এর মধ্যে {toBengaliNum(startItem)}–{toBengaliNum(endItem)} দেখানো হচ্ছে
      </p>

      {/* Page controls */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <button
          onClick={() => onPageChange(0)}
          disabled={currentPage === 0}
          className="w-8 h-8 rounded-sm flex items-center justify-center text-muted-foreground hover:text-gold hover:bg-gold/5 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-all duration-200"
          title="প্রথম পৃষ্ঠা"
        >
          <ChevronsLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>

        {/* Previous */}
        <button
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="w-8 h-8 rounded-sm flex items-center justify-center text-muted-foreground hover:text-gold hover:bg-gold/5 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-all duration-200"
          title="পূর্ববর্তী"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-0.5 mx-1">
          {getPageNumbers().map((p, i) =>
            p === 'ellipsis' ? (
              <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-muted-foreground/50 text-xs select-none">
                ···
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-sm text-xs font-semibold transition-all duration-200 ${
                  currentPage === p
                    ? 'gradient-gold text-white shadow-[0_2px_8px_-2px_hsl(var(--gold)/0.4)]'
                    : 'text-muted-foreground hover:text-gold hover:bg-gold/5 border border-transparent hover:border-gold/20'
                }`}
              >
                {toBengaliNum(p + 1)}
              </button>
            )
          )}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage >= totalPages - 1}
          className="w-8 h-8 rounded-sm flex items-center justify-center text-muted-foreground hover:text-gold hover:bg-gold/5 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-all duration-200"
          title="পরবর্তী"
        >
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages - 1)}
          disabled={currentPage >= totalPages - 1}
          className="w-8 h-8 rounded-sm flex items-center justify-center text-muted-foreground hover:text-gold hover:bg-gold/5 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-all duration-200"
          title="শেষ পৃষ্ঠা"
        >
          <ChevronsRight className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};

export default AdminPagination;
