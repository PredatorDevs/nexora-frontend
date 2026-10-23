import { InboxOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Input, Popconfirm, Space, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import * as api from '../inventory.api.js';

const date = (value) => value ? new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium' }).format(new Date(value)) : '—';

export function InventoryReceiptPage() {
  const [search, setSearch] = useState('');
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['inventory', 'eligible-receipts', search],
    queryFn: () => api.listEligibleReceipts(search),
  });
  const posting = useMutation({
    mutationFn: api.postReceipt,
    onSuccess: async (result) => {
      message.success(`${result.lots.length} lote(s) ingresados al inventario.`);
      await client.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error) => message.error(error.message),
  });
  const columns = [
    { title: 'Recepción', dataIndex: 'code' },
    { title: 'Proveedor', render: (_, item) => `${item.supplier.code} · ${item.supplier.name}` },
    { title: 'Almacén', render: (_, item) => `${item.warehouse.code} · ${item.warehouse.name}` },
    { title: 'Fecha', render: (_, item) => date(item.purchaseDate) },
    { title: 'Líneas', dataIndex: 'pendingLines', width: 85 },
    {
      title: 'Costeo',
      render: (_, item) => item.costingMode === 'LANDED_COST'
        ? <Tag color="purple">Retaceo</Tag>
        : <Tag color="blue">Directo</Tag>,
    },
    {
      title: 'Preparación',
      render: (_, item) => item.eligible
        ? <Tag color="green">Lista para ingresar</Tag>
        : <Typography.Text type="warning">{item.reason}</Typography.Text>,
    },
    {
      title: 'Acciones',
      render: (_, item) => (
        <Popconfirm
          title={`¿Ingresar ${item.code} al inventario?`}
          description="Se crearán los lotes, movimientos de Kardex y costos promedio. Esta operación no se repite."
          disabled={!item.eligible}
          onConfirm={() => posting.mutate(item)}
        >
          <Button type="primary" icon={<InboxOutlined />} disabled={!item.eligible} loading={posting.isPending}>
            Ingresar
          </Button>
        </Popconfirm>
      ),
    },
  ];
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Ingreso a inventario"
        description="Convierte recepciones verificadas en lotes y movimientos de existencias."
      />
      <Alert
        type="info"
        showIcon
        message="Las recepciones de costo directo pueden ingresarse inmediatamente. Las importaciones requieren un retaceo cerrado."
      />
      <Card>
        <Input.Search
          allowClear
          placeholder="Buscar recepción, factura o proveedor"
          onSearch={(value) => setSearch(value.trim())}
          style={{ maxWidth: 420, marginBottom: 16 }}
        />
        <Table
          rowKey="id"
          columns={columns}
          dataSource={query.data ?? []}
          loading={query.isLoading}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 1050 }}
        />
      </Card>
    </Space>
  );
}
