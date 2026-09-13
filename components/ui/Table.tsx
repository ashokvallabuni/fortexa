'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> extends HTMLAttributes<HTMLTableElement> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  striped?: boolean;
  hoverable?: boolean;
  emptyMessage?: string;
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
}

function Table<T>({
  className,
  columns,
  data,
  keyExtractor,
  striped = true,
  hoverable = true,
  emptyMessage = 'No data available',
  loading = false,
  pagination,
  ...props
}: TableProps<T>) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  if (loading) {
    return (
      <div className={cn('rounded-xl border border-border bg-surface overflow-hidden', className)}>
        <div className="p-8 text-center">
          <div className="animate-spin inline-block h-8 w-8 border-2 border-nano-blue border-t-transparent rounded-full" />
          <p className="mt-4 text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn('rounded-xl border border-border bg-surface overflow-hidden', className)}>
        <div className="p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-4 text-muted">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border border-border bg-surface overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full" {...props}>
          <thead className="bg-nano-blue/5 border-b border-border">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider',
                    alignClasses[column.align || 'left'],
                    column.className
                  )}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {data.map((row, rowIndex) => (
              <tr
                key={keyExtractor(row)}
                className={cn(
                  'transition-colors duration-150',
                  striped && rowIndex % 2 === 1 && 'bg-nano-blue/3',
                  hoverable && 'hover:bg-nano-blue/5'
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-4 py-3.5 text-sm text-foreground',
                      alignClasses[column.align || 'left'],
                      column.className
                    )}
                  >
                    {column.render
                      ? column.render(row, rowIndex)
                      : String((row as Record<string, unknown>)[column.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-4 text-sm text-muted">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pagination.pageSize}
              onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
              className="px-3 py-1.5 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-nano-blue/30 focus:border-nano-blue"
              aria-label="Rows per page"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1.5 text-sm bg-surface border border-border rounded-lg hover:border-nano-blue/30 hover:text-nano-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              Previous
            </button>
            <span>
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              className="px-3 py-1.5 text-sm bg-surface border border-border rounded-lg hover:border-nano-blue/30 hover:text-nano-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { Table };