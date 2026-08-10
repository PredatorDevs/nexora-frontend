import { Table } from 'antd';

import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { ErrorState } from '@/components/feedback/ErrorState.jsx';
import styles from '@/components/shared.module.css';

function normalizeSorter(sorter) {
  const active = Array.isArray(sorter)
    ? sorter.find(({ order }) => order)
    : sorter;
  if (!active?.order) return { sortBy: undefined, sortOrder: undefined };
  return {
    sortBy: active.field ?? active.columnKey,
    sortOrder: active.order === 'ascend' ? 'asc' : 'desc',
  };
}

export function DataTable({
  ariaLabel = 'Tabla de datos',
  columns,
  dataSource = [],
  error,
  isLoading = false,
  onChange,
  onRetry,
  pagination,
  rowKey = 'id',
  emptyTitle,
  emptyDescription,
}) {
  if (error && !isLoading && dataSource.length === 0) {
    return <ErrorState compact error={error} onRetry={onRetry} />;
  }

  const tablePagination = pagination
    ? {
        current: pagination.page,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50, 100],
        showTotal: (total) => `${total} resultado${total === 1 ? '' : 's'}`,
      }
    : false;

  function tableChanged(nextPagination, filters, sorter) {
    onChange?.({
      page: nextPagination.current ?? 1,
      pageSize: nextPagination.pageSize ?? pagination?.pageSize ?? 20,
      ...normalizeSorter(sorter),
      filters,
    });
  }

  return (
    <section className={styles.table} aria-label={ariaLabel}>
      <Table
        columns={columns}
        dataSource={dataSource}
        loading={isLoading}
        locale={{
          emptyText: (
            <EmptyState
              compact
              description={emptyDescription}
              title={emptyTitle ?? 'No hay resultados'}
            />
          ),
        }}
        onChange={tableChanged}
        pagination={tablePagination}
        rowKey={rowKey}
        scroll={{ x: 'max-content' }}
      />
    </section>
  );
}
