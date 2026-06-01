import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }: PaginationProps) {
  if (totalItems === 0) return null;

  const startOffset = Math.max(0, (currentPage - 1) * itemsPerPage);
  const endOffset = Math.min(totalItems, currentPage * itemsPerPage);

  return (
    <div className="px-5 py-3 border-t border-outline-variant flex items-center justify-between bg-surface-container-low rounded-b-2xl">
      <span className="text-xs text-on-surface-variant">
        Showing <span className="font-semibold text-on-surface">{startOffset + 1}</span> to <span className="font-semibold text-on-surface">{endOffset}</span> of <span className="font-semibold text-on-surface">{totalItems}</span> items
      </span>
      <div className="flex items-center gap-2 text-sm">
        <button 
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent border border-transparent hover:border-outline-variant"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-xs font-semibold text-on-surface bg-surface-container-high px-3 py-1.5 rounded-lg border border-outline-variant">
          Page {currentPage} of {Math.max(1, totalPages)}
        </div>
        <button 
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent border border-transparent hover:border-outline-variant"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
