import { EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Descriptions, Input, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import { useState } from 'react';
import { Can } from '@/components/authorization/Can.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { permissions } from '@/config/permissions.js';
import { InventoryAdjustmentForm } from '../components/InventoryAdjustmentForm.jsx';
import * as api from '../inventory-adjustments.api.js';

const labels = { DRAFT: 'Borrador', APPROVED: 'Aprobado', CANCELLED: 'Cancelado' };
const colors = { DRAFT: 'blue', APPROVED: 'green', CANCELLED: 'default' };
const initial = { page: 1, pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' };
const date = (value) => value ? new Intl.DateTimeFormat('es-SV', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—';

export function InventoryAdjustmentPage() {
  const [filters, setFilters] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const client = useQueryClient();
  const list = useQuery({ queryKey: ['inventory-adjustments', filters], queryFn: () => api.listAdjustments(filters) });
  const detail = useQuery({ queryKey: ['inventory-adjustments', 'detail', selectedId], queryFn: () => api.getAdjustment(selectedId), enabled: Boolean(selectedId) });
  const refresh = async () => { await client.invalidateQueries({ queryKey: ['inventory-adjustments'] }); await client.invalidateQueries({ queryKey: ['inventory'] }); };
  const create = useMutation({ mutationFn: api.createAdjustment, onSuccess: async () => { message.success('Borrador de ajuste creado.'); setCreating(false); await refresh(); }, onError: (error) => message.error(error.message) });
  const transition = useMutation({ mutationFn: ({ item, action, reason }) => api.transitionAdjustment(item, action, reason), onSuccess: async (_, value) => { message.success(value.action === 'approve' ? 'Ajuste aprobado y aplicado.' : 'Ajuste cancelado.'); await refresh(); }, onError: (error) => message.error(error.message) });
  const cancel = (item) => Modal.confirm({
    title: 'Cancelar ajuste', content: <Input.TextArea id="adjustment-cancel-reason" rows={3} placeholder="Motivo de cancelación" />,
    onOk: () => { const reason = document.getElementById('adjustment-cancel-reason')?.value.trim(); if (!reason || reason.length < 3) { message.error('Escribe un motivo de al menos 3 caracteres.'); return Promise.reject(); } return transition.mutateAsync({ item, action: 'cancel', reason }); },
  });
  const actions = (item) => <Space wrap>
    <Button icon={<EyeOutlined />} onClick={() => setSelectedId(item.id)}>Ver</Button>
    {item.status === 'DRAFT' ? <Can permission={permissions.inventory.adjustmentsApprove}><Popconfirm title="¿Aprobar y aplicar el ajuste?" description="Esta acción modificará existencias, valoración y Kardex." onConfirm={() => transition.mutate({ item, action: 'approve' })}><Button type="primary">Aprobar</Button></Popconfirm></Can> : null}
    {item.status === 'DRAFT' ? <Can permission={permissions.inventory.adjustmentsCreate}><Button danger onClick={() => cancel(item)}>Cancelar</Button></Can> : null}
  </Space>;
  return <Space direction="vertical" size="large" style={{ width: '100%' }}>
    <PageHeader title="Ajustes de inventario" description="Registra correcciones autorizadas sin alterar el historial del Kardex." extra={<Can permission={permissions.inventory.adjustmentsCreate}><Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>Nuevo ajuste</Button></Can>} />
    <Space wrap><Input.Search allowClear placeholder="Código, motivo o almacén" onSearch={(search) => setFilters({ ...initial, search: search.trim() || undefined })} style={{ width: 330 }} /><Select allowClear placeholder="Estado" style={{ width: 180 }} options={Object.entries(labels).map(([value, label]) => ({ value, label }))} onChange={(status) => setFilters((value) => ({ ...value, page: 1, status }))} /></Space>
    <Table rowKey="id" loading={list.isLoading} dataSource={list.data?.adjustments ?? []} pagination={{ current: filters.page, pageSize: filters.pageSize, total: list.data?.pagination.total ?? 0, onChange: (page, pageSize) => setFilters((value) => ({ ...value, page, pageSize })) }} scroll={{ x: 1000 }} columns={[
      { title: 'Código', dataIndex: 'code' }, { title: 'Almacén', render: (_, x) => `${x.warehouse.code} · ${x.warehouse.name}` },
      { title: 'Motivo', dataIndex: 'reason' }, { title: 'Estado', render: (_, x) => <Tag color={colors[x.status]}>{labels[x.status]}</Tag> },
      { title: 'Creado', render: (_, x) => date(x.createdAt) }, { title: 'Acciones', render: (_, x) => actions(x) },
    ]} />
    <Modal open={creating} width={1100} title="Nuevo ajuste" footer={null} onCancel={() => setCreating(false)} destroyOnHidden><InventoryAdjustmentForm onCancel={() => setCreating(false)} onSubmit={(values) => create.mutateAsync(values)} isSubmitting={create.isPending} /></Modal>
    <Modal open={Boolean(selectedId)} width={1000} title={detail.data ? `Ajuste ${detail.data.code}` : 'Ajuste'} footer={null} onCancel={() => setSelectedId(null)}>
      {detail.data ? <><Descriptions bordered column={2} items={[
        { key: 'status', label: 'Estado', children: <Tag color={colors[detail.data.status]}>{labels[detail.data.status]}</Tag> }, { key: 'warehouse', label: 'Almacén', children: `${detail.data.warehouse.branch.name} / ${detail.data.warehouse.name}` },
        { key: 'reason', label: 'Motivo', span: 2, children: detail.data.reason }, { key: 'created', label: 'Creado', children: `${date(detail.data.createdAt)} · ${detail.data.createdBy.displayName}` },
        { key: 'approved', label: 'Aprobado', children: detail.data.approvedBy ? `${date(detail.data.approvedAt)} · ${detail.data.approvedBy.displayName}` : '—' }, { key: 'notes', label: 'Observaciones', span: 2, children: detail.data.notes || '—' },
      ]} /><Table rowKey="id" pagination={false} dataSource={detail.data.details} style={{ marginTop: 16 }} columns={[
        { title: '#', dataIndex: 'lineNumber' }, { title: 'Producto', render: (_, x) => `${x.inventoryLot.product.internalCode} · ${x.inventoryLot.product.name}` }, { title: 'Lote', render: (_, x) => x.inventoryLot.code },
        { title: 'Ubicación', render: (_, x) => x.location.code }, { title: 'Tipo', render: (_, x) => x.direction === 'IN' ? 'Entrada' : 'Salida' }, { title: 'Cantidad', render: (_, x) => `${x.quantity} ${x.inventoryLot.stockUnit.code}` },
      ]} /></> : null}
    </Modal>
  </Space>;
}

