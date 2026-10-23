import { EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Descriptions, Input, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import { useState } from 'react';
import { Can } from '@/components/authorization/Can.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { permissions } from '@/config/permissions.js';
import { InventoryTransferForm } from '../components/InventoryTransferForm.jsx';
import { InventoryRelocationForm } from '../components/InventoryRelocationForm.jsx';
import * as api from '../inventory-transfers.api.js';

const labels = { PREPARATION: 'En preparación', IN_TRANSIT: 'En tránsito', RECEIVED: 'Recibido', INCIDENT: 'Incidencia', CANCELLED: 'Cancelado' };
const colors = { PREPARATION: 'blue', IN_TRANSIT: 'gold', RECEIVED: 'green', INCIDENT: 'red', CANCELLED: 'default' };
const initial = { page: 1, pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' };
const date = (value) => value ? new Intl.DateTimeFormat('es-SV', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—';

export function InventoryTransferPage() {
  const [filters, setFilters] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [relocating, setRelocating] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const client = useQueryClient();
  const list = useQuery({ queryKey: ['inventory-transfers', filters], queryFn: () => api.listTransfers(filters) });
  const detail = useQuery({ queryKey: ['inventory-transfers', 'detail', selectedId], queryFn: () => api.getTransfer(selectedId), enabled: Boolean(selectedId) });
  const refresh = async () => { await client.invalidateQueries({ queryKey: ['inventory-transfers'] }); await client.invalidateQueries({ queryKey: ['inventory'] }); };
  const create = useMutation({ mutationFn: api.createTransfer, onSuccess: async () => { message.success('Traslado creado.'); setCreating(false); await refresh(); }, onError: (error) => message.error(error.message) });
  const relocate = useMutation({ mutationFn: api.createRelocation, onSuccess: async () => { message.success('Existencias reubicadas.'); setRelocating(false); await refresh(); }, onError: (error) => message.error(error.message) });
  const transition = useMutation({
    mutationFn: ({ item, action, reason }) => api.transitionTransfer(item, action, reason),
    onSuccess: async (_, variables) => { message.success(variables.action === 'dispatch' ? 'Traslado despachado.' : variables.action === 'receive' ? 'Traslado recibido.' : 'Traslado actualizado.'); await refresh(); },
    onError: (error) => message.error(error.message),
  });
  const reason = (item, action, title) => Modal.confirm({
    title, content: <Input.TextArea id="transfer-reason" rows={3} placeholder="Describe el motivo" />,
    onOk: () => {
      const value = document.getElementById('transfer-reason')?.value.trim();
      if (!value || value.length < 3) { message.error('Escribe un motivo de al menos 3 caracteres.'); return Promise.reject(); }
      return transition.mutateAsync({ item, action, reason: value });
    },
  });
  const actions = (item) => <Space wrap>
    <Button icon={<EyeOutlined />} onClick={() => setSelectedId(item.id)}>Ver</Button>
    {item.status === 'PREPARATION' ? <Can permission={permissions.inventory.transfersDispatch}><Popconfirm title="¿Confirmar el despacho?" description="La mercancía saldrá del stock disponible del origen." onConfirm={() => transition.mutate({ item, action: 'dispatch' })}><Button type="primary">Despachar</Button></Popconfirm></Can> : null}
    {['IN_TRANSIT', 'INCIDENT'].includes(item.status) ? <Can permission={permissions.inventory.transfersReceive}><Popconfirm title="¿Confirmar la recepción?" description="La mercancía ingresará a las ubicaciones destino." onConfirm={() => transition.mutate({ item, action: 'receive' })}><Button type="primary">Recibir</Button></Popconfirm></Can> : null}
    {item.status === 'IN_TRANSIT' ? <Can permission={permissions.inventory.transfersReceive}><Button danger onClick={() => reason(item, 'incident', 'Registrar incidencia')}>Incidencia</Button></Can> : null}
    {item.status === 'PREPARATION' ? <Can permission={permissions.inventory.transfersCancel}><Button danger onClick={() => reason(item, 'cancel', 'Cancelar traslado')}>Cancelar</Button></Can> : null}
  </Space>;
  return <Space direction="vertical" size="large" style={{ width: '100%' }}>
    <PageHeader title="Traslados de inventario" description="Controla traslados entre almacenes y reubicaciones internas." extra={<Space><Can permission={permissions.inventory.relocationsCreate}><Button onClick={() => setRelocating(true)}>Reubicar dentro del almacén</Button></Can><Can permission={permissions.inventory.transfersCreate}><Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>Nuevo traslado</Button></Can></Space>} />
    <Space wrap><Input.Search allowClear placeholder="Código o almacén" onSearch={(search) => setFilters({ ...initial, search: search.trim() || undefined })} style={{ width: 320 }} /><Select allowClear placeholder="Estado" style={{ width: 190 }} options={Object.entries(labels).map(([value, label]) => ({ value, label }))} onChange={(status) => setFilters((value) => ({ ...value, page: 1, status }))} /></Space>
    <Table rowKey="id" loading={list.isLoading} dataSource={list.data?.transfers ?? []} pagination={{ current: filters.page, pageSize: filters.pageSize, total: list.data?.pagination.total ?? 0, onChange: (page, pageSize) => setFilters((value) => ({ ...value, page, pageSize })) }} scroll={{ x: 1100 }} columns={[
      { title: 'Código', dataIndex: 'code' },
      { title: 'Origen', render: (_, x) => `${x.sourceWarehouse.code} · ${x.sourceWarehouse.name}` },
      { title: 'Destino', render: (_, x) => `${x.destinationWarehouse.code} · ${x.destinationWarehouse.name}` },
      { title: 'Estado', render: (_, x) => <Tag color={colors[x.status]}>{labels[x.status]}</Tag> },
      { title: 'Creado', render: (_, x) => date(x.createdAt) },
      { title: 'Acciones', render: (_, x) => actions(x) },
    ]} />
    <Modal open={creating} width={1050} title="Nuevo traslado" footer={null} onCancel={() => setCreating(false)} destroyOnHidden><InventoryTransferForm onCancel={() => setCreating(false)} onSubmit={(values) => create.mutateAsync(values)} isSubmitting={create.isPending} /></Modal>
    <Modal open={relocating} width={1050} title="Reubicación interna" footer={null} onCancel={() => setRelocating(false)} destroyOnHidden><InventoryRelocationForm onCancel={() => setRelocating(false)} onSubmit={(values) => relocate.mutateAsync(values)} isSubmitting={relocate.isPending} /></Modal>
    <Modal open={Boolean(selectedId)} width={1000} title={detail.data ? `Traslado ${detail.data.code}` : 'Traslado'} footer={null} onCancel={() => setSelectedId(null)}>
      {detail.data ? <><Descriptions bordered column={2} items={[
        { key: 'status', label: 'Estado', children: <Tag color={colors[detail.data.status]}>{labels[detail.data.status]}</Tag> },
        { key: 'created', label: 'Creado', children: `${date(detail.data.createdAt)} · ${detail.data.createdBy.displayName}` },
        { key: 'source', label: 'Origen', children: `${detail.data.sourceWarehouse.branch.name} / ${detail.data.sourceWarehouse.name}` },
        { key: 'destination', label: 'Destino', children: `${detail.data.destinationWarehouse.branch.name} / ${detail.data.destinationWarehouse.name}` },
        { key: 'dispatch', label: 'Despachado', children: date(detail.data.dispatchedAt) },
        { key: 'received', label: 'Recibido', children: date(detail.data.receivedAt) },
        { key: 'notes', label: 'Observaciones', span: 2, children: detail.data.notes || '—' },
        { key: 'incident', label: 'Incidencia', span: 2, children: detail.data.incidentNotes || '—' },
      ]} /><Table rowKey="id" pagination={false} dataSource={detail.data.details} style={{ marginTop: 16 }} columns={[
        { title: '#', dataIndex: 'lineNumber' },
        { title: 'Producto', render: (_, x) => `${x.inventoryLot.product.internalCode} · ${x.inventoryLot.product.name}` },
        { title: 'Lote', render: (_, x) => x.inventoryLot.code },
        { title: 'Origen', render: (_, x) => x.sourceLocation.code },
        { title: 'Destino', render: (_, x) => x.destinationLocation.code },
        { title: 'Cantidad', render: (_, x) => `${x.quantity} ${x.inventoryLot.stockUnit.code}` },
      ]} /></> : null}
    </Modal>
  </Space>;
}
