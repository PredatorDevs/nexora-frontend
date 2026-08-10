import { Pagination } from 'antd';

import styles from '@/components/shared.module.css';

export function PaginationControl({
  page,
  pageSize,
  total,
  onChange,
  pageSizeOptions = [10, 20, 50, 100],
}) {
  return (
    <div className={styles.pagination}>
      <Pagination
        current={page}
        onChange={(nextPage, nextPageSize) =>
          onChange?.({ page: nextPage, pageSize: nextPageSize })
        }
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        showSizeChanger
        showTotal={(count) => `${count} resultado${count === 1 ? '' : 's'}`}
        total={total}
      />
    </div>
  );
}
