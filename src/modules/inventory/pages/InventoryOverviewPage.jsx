import { useQuery } from '@tanstack/react-query';
import { DatePicker, Input, Select, Space, Table, Tabs, Tag } from 'antd';
import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { useAuth } from '@/auth/useAuth.js';
import { permissions as permissionCodes } from '@/config/permissions.js';
import * as api from '../inventory.api.js';

const base = { page: 1, pageSize: 20, sortOrder: 'desc' };
const number = (value, digits = 4) => Number(value ?? 0).toLocaleString('es-SV', { minimumFractionDigits: 0, maximumFractionDigits: digits });
const money = (value) => Number(value ?? 0).toLocaleString('es-SV', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 6 });
const date = (value) => value ? new Intl.DateTimeFormat('es-SV', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—';
const movementLabels = {
  PURCHASE_RECEIPT: 'Recepción de compra', TRANSFER_OUT: 'Salida por traslado',
  TRANSFER_IN: 'Entrada por traslado', SALE_ISSUE: 'Salida por venta',
  CUSTOMER_RETURN: 'Devolución', ADJUSTMENT_IN: 'Ajuste de entrada',
  ADJUSTMENT_OUT: 'Ajuste de salida', REVERSAL: 'Reversión',
};

function pagination(filters, data, setFilters) {
  return {
    current: filters.page, pageSize: filters.pageSize,
    total: data?.pagination.total ?? 0,
    onChange: (page, pageSize) => setFilters((value) => ({ ...value, page, pageSize })),
  };
}

export function InventoryOverviewPage() {
  const { permissions } = useAuth();
  const canKardex = permissions.includes(permissionCodes.inventory.kardexRead);
  const canCosts = permissions.includes(permissionCodes.inventory.costsRead);
  const [stockFilters, setStockFilters] = useState({ ...base, sortBy: 'updatedAt' });
  const [kardexFilters, setKardexFilters] = useState({ ...base, sortBy: 'movementDate' });
  const [costFilters, setCostFilters] = useState({ ...base, sortBy: 'updatedAt' });
  const stock = useQuery({ queryKey: ['inventory', 'stock', stockFilters], queryFn: () => api.listStock(stockFilters) });
  const kardex = useQuery({ queryKey: ['inventory', 'kardex', kardexFilters], queryFn: () => api.listKardex(kardexFilters), enabled: canKardex });
  const costs = useQuery({ queryKey: ['inventory', 'costs', costFilters], queryFn: () => api.listCosts(costFilters), enabled: canCosts });
  const search = (setter) => (value) => setter((current) => ({ ...current, page: 1, search: value.trim() || undefined }));
  const stockTab = <Space direction="vertical" style={{ width: '100%' }}>
    <Input.Search allowClear placeholder="Producto, lote o ubicación" onSearch={search(setStockFilters)} style={{ maxWidth: 420 }} />
    <Table rowKey="id" loading={stock.isLoading} dataSource={stock.data?.stock ?? []} pagination={pagination(stockFilters, stock.data, setStockFilters)} scroll={{ x: 1100 }} columns={[
      { title: 'Producto', render: (_, x) => `${x.inventoryLot.product.internalCode} · ${x.inventoryLot.product.name}` },
      { title: 'Lote', render: (_, x) => x.inventoryLot.code },
      { title: 'Sucursal', render: (_, x) => x.location.warehouse.branch.name },
      { title: 'Almacén', render: (_, x) => x.location.warehouse.name },
      { title: 'Ubicación', render: (_, x) => x.location.code },
      { title: 'Existencia', render: (_, x) => `${number(x.quantity)} ${x.inventoryLot.stockUnit.code}` },
      { title: 'Costo unitario', render: (_, x) => money(x.inventoryLot.unitCost) },
      { title: 'Valor', render: (_, x) => money(Number(x.quantity) * Number(x.inventoryLot.unitCost)) },
    ]} />
  </Space>;
  const kardexTab = <Space direction="vertical" style={{ width: '100%' }}>
    <Space wrap>
      <Input.Search allowClear placeholder="Producto, lote o motivo" onSearch={search(setKardexFilters)} style={{ width: 320 }} />
      <Select allowClear placeholder="Tipo de movimiento" style={{ width: 220 }} options={Object.entries(movementLabels).map(([value, label]) => ({ value, label }))} onChange={(movementType) => setKardexFilters((current) => ({ ...current, page: 1, movementType }))} />
      <DatePicker.RangePicker onChange={(values) => setKardexFilters((current) => ({ ...current, page: 1, dateFrom: values?.[0]?.startOf('day').toISOString(), dateTo: values?.[1]?.endOf('day').toISOString() }))} />
    </Space>
    <Table rowKey="id" loading={kardex.isLoading} dataSource={kardex.data?.movements ?? []} pagination={pagination(kardexFilters, kardex.data, setKardexFilters)} scroll={{ x: 1250 }} columns={[
      { title: 'Fecha', render: (_, x) => date(x.movementDate) },
      { title: 'Movimiento', render: (_, x) => <Tag>{movementLabels[x.movementType] ?? x.movementType}</Tag> },
      { title: 'Producto', render: (_, x) => `${x.product.internalCode} · ${x.product.name}` },
      { title: 'Lote', render: (_, x) => x.inventoryLot.code },
      { title: 'Almacén', render: (_, x) => x.warehouse.name },
      { title: 'Ubicación', render: (_, x) => x.location?.code ?? 'Zona de recepción' },
      { title: 'Entrada', render: (_, x) => number(x.quantityIn) },
      { title: 'Salida', render: (_, x) => number(x.quantityOut) },
      { title: 'Costo', render: (_, x) => money(x.totalCost) },
      { title: 'Usuario', render: (_, x) => x.confirmedBy.displayName },
    ]} />
  </Space>;
  const costsTab = <Space direction="vertical" style={{ width: '100%' }}>
    <Input.Search allowClear placeholder="Código, SKU o producto" onSearch={search(setCostFilters)} style={{ maxWidth: 420 }} />
    <Table rowKey="id" loading={costs.isLoading} dataSource={costs.data?.costs ?? []} pagination={pagination(costFilters, costs.data, setCostFilters)} columns={[
      { title: 'Producto', render: (_, x) => `${x.product.internalCode} · ${x.product.name}` },
      { title: 'SKU', render: (_, x) => x.product.sku ?? '—' },
      { title: 'Existencia global', render: (_, x) => `${number(x.quantityOnHand)} ${x.product.saleUnit.code}` },
      { title: 'Costo promedio', render: (_, x) => money(x.averageUnitCost) },
      { title: 'Valor del inventario', render: (_, x) => money(x.inventoryValue) },
      { title: 'Actualizado', render: (_, x) => date(x.updatedAt) },
    ]} />
  </Space>;
  return <Space direction="vertical" size="large" style={{ width: '100%' }}>
    <PageHeader title="Inventario" description="Consulta existencias físicas, movimientos de Kardex y valoración promedio." />
    <Tabs items={[
      { key: 'stock', label: 'Existencias por ubicación', children: stockTab },
      ...(canKardex ? [{ key: 'kardex', label: 'Kardex', children: kardexTab }] : []),
      ...(canCosts ? [{ key: 'costs', label: 'Costos promedio', children: costsTab }] : []),
    ]} />
  </Space>;
}
