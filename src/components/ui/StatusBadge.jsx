import { Tag } from 'antd';

const statusConfig = Object.freeze({
  ACTIVE: { color: 'success', label: 'Activo' },
  INACTIVE: { color: 'default', label: 'Inactivo' },
  SUCCESS: { color: 'success', label: 'Exitoso' },
  FAILURE: { color: 'error', label: 'Fallido' },
  REVOKED: { color: 'error', label: 'Revocada' },
  EXPIRED: { color: 'warning', label: 'Expirada' },
});

export function StatusBadge({ status, labels = {} }) {
  const config = statusConfig[status] ?? {
    color: 'default',
    label: String(status ?? '—'),
  };
  return <Tag color={config.color}>{labels[status] ?? config.label}</Tag>;
}
