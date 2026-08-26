import {
  DownOutlined,
  EditOutlined,
  StarFilled,
  StarOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Image, Space, Tag, Typography } from 'antd';
import { Can } from '@/components/authorization/Can.jsx';
import { permissions } from '@/config/permissions.js';
import { createFileReadUrl } from '../product-images.api.js';

export function ProductImageCard({
  image,
  index,
  total,
  busy,
  onEdit,
  onPrimary,
  onMove,
  onDelete,
}) {
  const readUrl = useQuery({
    queryKey: ['files', 'read-url', image.storageKey],
    queryFn: () => createFileReadUrl(image.storageKey),
    staleTime: 10 * 60 * 1000,
  });
  return (
    <Card
      size="small"
      cover={
        <div
          style={{
            height: 180,
            display: 'grid',
            placeItems: 'center',
            background: '#f5f5f5',
          }}
        >
          <Image
            src={readUrl.data?.url}
            alt={image.altText ?? 'Imagen del producto'}
            height={180}
            style={{ objectFit: 'contain', maxWidth: '100%' }}
            fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='180'%3E%3Crect width='100%25' height='100%25' fill='%23eee'/%3E%3C/svg%3E"
          />
        </div>
      }
      actions={[
        <Can key="edit" permission={permissions.productImages.update}>
          <EditOutlined onClick={onEdit} />
        </Can>,
        <Can key="primary" permission={permissions.productImages.update}>
          {image.isPrimary ? (
            <StarFilled style={{ color: '#faad14' }} />
          ) : (
            <StarOutlined onClick={onPrimary} />
          )}
        </Can>,
        <Can key="up" permission={permissions.productImages.update}>
          <UpOutlined onClick={() => index > 0 && onMove(index, index - 1)} />
        </Can>,
        <Can key="down" permission={permissions.productImages.update}>
          <DownOutlined
            onClick={() => index < total - 1 && onMove(index, index + 1)}
          />
        </Can>,
      ]}
    >
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        {image.isPrimary ? <Tag color="gold">Principal</Tag> : null}
        <Typography.Text>
          {image.altText || 'Sin texto alternativo'}
        </Typography.Text>
        <Typography.Text type="secondary">
          {image.caption || 'Sin descripción'}
        </Typography.Text>
        <Can permission={permissions.productImages.delete}>
          <Button danger size="small" loading={busy} onClick={onDelete}>
            Eliminar
          </Button>
        </Can>
      </Space>
    </Card>
  );
}
