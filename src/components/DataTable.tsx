import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface DataTableProps {
  data: Record<string, any>[];
  headers: string[];
  recordCount: number;
  tableName: string;
  pageSize?: number;
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  headers,
  recordCount,
  tableName,
  pageSize = 10,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / pageSize);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, currentPage, pageSize]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    // Format dates
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      try {
        const date = new Date(value);
        return date.toLocaleDateString('en-SG', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      } catch {
        return String(value);
      }
    }
    // Format numbers
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    const str = String(value);
    // Truncate very long values
    if (str.length > 50) {
      return str.substring(0, 50) + '...';
    }
    return str;
  };

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No records found in <strong>{tableName}</strong> table.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3" style={{ minWidth: 0 }}>
      {/* Header with count */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          Found <span className="font-semibold text-foreground">{recordCount}</span> record(s) in <span className="font-semibold text-foreground">{tableName}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, data.length)} of {data.length}
        </p>
      </div>

      {/* Table Container - with explicit scroll handling */}
      <div className="border rounded-lg bg-card relative">
        <div
          className="table-scroll-container"
          style={{
            display: 'block',
            width: '100%',
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '8px' // Space for scrollbar
          }}
        >
          <table
            className="text-sm border-collapse"
            style={{
              width: 'auto',
              minWidth: '100%',
              tableLayout: 'auto'
            }}
          >
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground text-xs w-12">#</th>
                {headers.map((header) => (
                  <th
                    key={header}
                    className="px-3 py-2.5 text-left font-medium text-muted-foreground text-xs whitespace-nowrap"
                  >
                    {header.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.map((row, rowIndex) => {
                const globalIndex = (currentPage - 1) * pageSize + rowIndex + 1;
                return (
                  <tr
                    key={rowIndex}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-3 py-2 text-muted-foreground text-xs font-mono">
                      {globalIndex}
                    </td>
                    {headers.map((header) => (
                      <td
                        key={header}
                        className="px-3 py-2 text-foreground whitespace-nowrap"
                      >
                        {formatCellValue(row[header])}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Scroll hint for mobile */}
        <div className="text-xs text-muted-foreground text-center py-1 border-t md:hidden">
          ← Scroll horizontally to see more columns →
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            {/* Page numbers */}
            <div className="flex items-center gap-1 mx-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 w-7 p-0 text-xs"
                    onClick={() => goToPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
