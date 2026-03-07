import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, ChevronDown, X } from 'lucide-react';
import { getAllUpazilas, type Upazila } from '@/data/bangladeshLocations';

interface UpazilaComboboxProps {
  value: Upazila | null;
  onChange: (upazila: Upazila | null) => void;
  hasError?: boolean;
}

const UpazilaCombobox = ({ value, onChange, hasError }: UpazilaComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allUpazilas = useMemo(() => getAllUpazilas(), []);

  const filtered = useMemo(() => {
    if (!search.trim()) return allUpazilas.slice(0, 50); // Show first 50 when no search
    const q = search.toLowerCase().trim();
    return allUpazilas.filter(
      u =>
        u.name.toLowerCase().includes(q) ||
        u.district.toLowerCase().includes(q) ||
        u.division.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [search, allUpazilas]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (upazila: Upazila) => {
    onChange(upazila);
    setSearch('');
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <div
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={`w-full bg-transparent border rounded-xl px-4 py-3 text-sm cursor-pointer flex items-center gap-2 transition-all ${
          hasError
            ? 'border-destructive/60 bg-destructive/5'
            : open
            ? 'border-gold/40 ring-2 ring-gold/20'
            : 'border-border/60 hover:border-border'
        }`}
      >
        <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        {value ? (
          <div className="flex-1 flex items-center justify-between min-w-0">
            <div className="truncate">
              <span className="text-foreground">{value.name}</span>
              <span className="text-muted-foreground text-xs ml-1.5">
                ({value.district}, {value.division})
              </span>
            </div>
            <button onClick={handleClear} className="ml-2 p-0.5 rounded hover:bg-muted/60 transition-colors flex-shrink-0">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <span className="text-muted-foreground flex-1">উপজেলা নির্বাচন করুন *</span>
        )}
        <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface border border-border/60 rounded-xl shadow-xl overflow-hidden"
            style={{ maxHeight: '280px' }}
          >
            {/* Search input */}
            <div className="sticky top-0 bg-surface border-b border-border/40 p-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="উপজেলা বা জেলা খুঁজুন..."
                  className="w-full bg-muted/30 border border-border/40 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold/30 focus:border-gold/40 placeholder:text-muted-foreground"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Results */}
            <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: '220px' }}>
              {filtered.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  কোনো ফলাফল পাওয়া যায়নি
                </div>
              ) : (
                filtered.map((uz, i) => {
                  const isSelected = value?.name === uz.name && value?.district === uz.district;
                  return (
                    <button
                      key={`${uz.division}-${uz.district}-${uz.name}-${i}`}
                      onClick={() => handleSelect(uz)}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors text-sm ${
                        isSelected
                          ? 'bg-gold/10 text-gold'
                          : 'hover:bg-muted/40 text-foreground'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <span className="font-medium">{uz.name}</span>
                        <span className="text-xs text-muted-foreground ml-1.5">
                          {uz.district} • {uz.division}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UpazilaCombobox;
