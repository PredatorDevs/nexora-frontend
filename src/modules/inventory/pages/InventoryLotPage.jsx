import { EnvironmentOutlined, EyeOutlined, PrinterOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Descriptions, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, message } from 'antd';
import { useState } from 'react';
import { Can } from '@/components/authorization/Can.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { permissions } from '@/config/permissions.js';
import { listLocations } from '@/modules/locations/locations.api.js';
import * as api from '../inventory.api.js';

const initialFilters = { page: 1, pageSize: 20, sortBy: 'receivedAt', sortOrder: 'desc' };
const number = (value) => Number(value ?? 0).toLocaleString('es-SV', { maximumFractionDigits: 4 });

export function InventoryLotPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [selectedId, setSelectedId] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [form] = Form.useForm();
  const [printForm] = Form.useForm();
  const client = useQueryClient();
  const list = useQuery({ queryKey: ['inventory', 'lots', filters], queryFn: () => api.listLots(filters) });
  const detail = useQuery({ queryKey: ['inventory', 'lot', selectedId], queryFn: () => api.getLot(selectedId), enabled: Boolean(selectedId) });
  const locations = useQuery({
    queryKey: ['locations', 'inventory', detail.data?.purchaseDetail.purchase.warehouseId],
    queryFn: () => listLocations({ page: 1, pageSize: 100, sortBy: 'code', sortOrder: 'asc', isActive: true, warehouseId: detail.data.purchaseDetail.purchase.warehouseId }),
    enabled: Boolean(assigning && detail.data),
  });
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: ['inventory'] });
  };
  const assign = useMutation({
    mutationFn: (data) => api.assignLocation(selectedId, data),
    onSuccess: async () => { message.success('Mercancía asignada a la ubicación.'); setAssigning(false); form.resetFields(); await refresh(); },
    onError: (error) => message.error(error.message),
  });
  const print = useMutation({
    mutationFn: (data) => api.printLabels(detail.data, data),
    onSuccess: async () => { message.success('Etiquetas generadas.'); setPrinting(false); printForm.resetFields(); await refresh(); },
    onError: (error) => message.error(error.message),
  });
  const assigned = detail.data?.locationDetails.reduce((sum, item) => sum + Number(item.quantity), 0) ?? 0;
  const pending = Math.max(0, Number(detail.data?.stockQuantity ?? 0) - assigned);
  const columns = [
    { title: 'Lote', dataIndex: 'code' },
    { title: 'Producto', render: (_, item) => `${item.product.internalCode} · ${item.product.name}` },
    { title: 'Recepción', render: (_, item) => item.purchaseDetail.purchase.code },
    { title: 'Almacén', render: (_, item) => item.purchaseDetail.purchase.warehouse.name },
    { title: 'Cantidad', render: (_, item) => `${number(item.stockQuantity)} ${item.stockUnit.code}` },
    { title: 'Estado', render: (_, item) => <Tag color={item.status === 'AVAILABLE' ? 'green' : 'default'}>{item.status}</Tag> },
    { title: 'Acciones', render: (_, item) => <Button icon={<EyeOutlined />} onClick={() => setSelectedId(item.id)}>Ver</Button> },
  ];
  return <Space direction="vertical" size="large" style={{ width: '100%' }}>
    <PageHeader title="Lotes de inventario" description="Consulta, etiqueta y ubica la mercancía recibida." />
    <Input.Search allowClear placeholder="Buscar lote, producto o recepción" onSearch={(search) => setFilters({ ...initialFilters, search: search.trim() || undefined })} style={{ maxWidth: 420 }} />
    <Table rowKey="id" columns={columns} dataSource={list.data?.lots ?? []} loading={list.isLoading} pagination={{ current: filters.page, pageSize: filters.pageSize, total: list.data?.pagination.total ?? 0, onChange: (page, pageSize) => setFilters((value) => ({ ...value, page, pageSize })) }} scroll={{ x: 900 }} />
    <Modal open={Boolean(selectedId)} width={950} title={detail.data ? `Lote ${detail.data.code}` : 'Lote'} footer={null} onCancel={() => setSelectedId(null)}>
      {detail.data ? <>
        <Descriptions bordered column={2} items={[
          { key: 'product', label: 'Producto', children: `${detail.data.product.internalCode} · ${detail.data.product.name}` },
          { key: 'receipt', label: 'Recepción', children: detail.data.purchaseDetail.purchase.code },
          { key: 'received', label: 'Cantidad recibida', children: `${number(detail.data.receivedQuantity)} ${detail.data.receivedUnit.code}` },
          { key: 'stock', label: 'Cantidad base', children: `${number(detail.data.stockQuantity)} ${detail.data.stockUnit.code}` },
          { key: 'assigned', label: 'Ubicada', children: number(assigned) },
          { key: 'pending', label: 'Pendiente de ubicar', children: number(pending) },
        ]} />
        <Space style={{ margin: '16px 0' }}>
          <Can permission={permissions.inventory.locationsAssign}><Button icon={<EnvironmentOutlined />} disabled={pending <= 0} onClick={() => setAssigning(true)}>Asignar ubicación</Button></Can>
          <Can permission={permissions.inventory.labelsPrint}><Button icon={<PrinterOutlined />} onClick={() => setPrinting(true)}>Imprimir etiquetas</Button></Can>
        </Space>
        <Table rowKey="id" pagination={false} dataSource={detail.data.locationDetails} columns={[
          { title: 'Ubicación', render: (_, item) => item.location.code },
          { title: 'Pasillo', render: (_, item) => item.location.aisle },
          { title: 'Estante', render: (_, item) => item.location.rack },
          { title: 'Nivel', render: (_, item) => item.location.level },
          { title: 'Posición', render: (_, item) => item.location.position },
          { title: 'Cantidad', dataIndex: 'quantity' },
        ]} />
      </> : null}
    </Modal>
    <Modal open={assigning} title="Asignar mercancía a ubicación" footer={null} onCancel={() => setAssigning(false)}>
      <Form form={form} layout="vertical" onFinish={(values) => assign.mutate(values)}>
        <Form.Item name="locationId" label="Ubicación" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" loading={locations.isLoading} options={locations.data?.locations.map((item) => ({ value: item.id, label: item.code }))} /></Form.Item>
        <Form.Item name="quantity" label={`Cantidad (máximo ${number(pending)})`} rules={[{ required: true }]}><InputNumber min={0.0001} max={pending} precision={4} style={{ width: '100%' }} /></Form.Item>
        <Button type="primary" htmlType="submit" loading={assign.isPending}>Guardar asignación</Button>
      </Form>
    </Modal>
    <Modal open={printing} title="Imprimir etiquetas" footer={null} onCancel={() => setPrinting(false)}>
      <Form form={printForm} layout="vertical" initialValues={{ quantity: 1 }} onFinish={(values) => print.mutate({ ...values, reprintReason: values.reprintReason?.trim() || null })}>
        <Form.Item name="quantity" label="Número de etiquetas" rules={[{ required: true }]}><InputNumber min={1} max={1000} precision={0} style={{ width: '100%' }} /></Form.Item>
        {(detail.data?.labelPrints.length ?? 0) > 0 ? <Form.Item name="reprintReason" label="Motivo de reimpresión" rules={[{ required: true, min: 3 }]}><Input.TextArea maxLength={500} /></Form.Item> : null}
        <Button type="primary" htmlType="submit" loading={print.isPending}>Generar PDF</Button>
      </Form>
    </Modal>
  </Space>;
}
