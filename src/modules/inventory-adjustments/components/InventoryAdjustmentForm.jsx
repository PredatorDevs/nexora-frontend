import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Form, Input, InputNumber, Select, Space } from 'antd';
import { useState } from 'react';
import { listLots } from '@/modules/inventory/inventory.api.js';
import { listLocations } from '@/modules/locations/locations.api.js';
import { listWarehouses } from '@/modules/warehouses/warehouses.api.js';

export function InventoryAdjustmentForm({ onCancel, onSubmit, isSubmitting }) {
  const [form] = Form.useForm();
  const [warehouseId, setWarehouseId] = useState();
  const warehouses = useQuery({ queryKey: ['warehouses', 'adjustment'], queryFn: () => listWarehouses({ page: 1, pageSize: 100, sortBy: 'name', sortOrder: 'asc', isActive: true }) });
  const lots = useQuery({ queryKey: ['inventory', 'adjustment-lots'], queryFn: () => listLots({ page: 1, pageSize: 100, sortBy: 'receivedAt', sortOrder: 'desc', status: 'AVAILABLE' }) });
  const locations = useQuery({ queryKey: ['locations', 'adjustment', warehouseId], queryFn: () => listLocations({ page: 1, pageSize: 100, sortBy: 'code', sortOrder: 'asc', isActive: true, warehouseId }), enabled: Boolean(warehouseId) });
  const lotOptions = lots.data?.lots.map((item) => ({ value: item.id, label: `${item.code} · ${item.product.internalCode} · ${item.product.name}` })) ?? [];
  async function finish(values) {
    await onSubmit({
      warehouseId: values.warehouseId, reason: values.reason.trim(), notes: values.notes?.trim() || null,
      details: values.details.map((line) => ({ ...line, notes: line.notes?.trim() || null })),
    });
  }
  return <Form form={form} layout="vertical" onFinish={finish} initialValues={{ details: [{ direction: 'OUT', quantity: 1 }] }}>
    {(warehouses.error || lots.error || locations.error) ? <Alert type="error" showIcon message="No fue posible cargar los catálogos del ajuste." style={{ marginBottom: 16 }} /> : null}
    <Space align="start" wrap style={{ width: '100%' }}>
      <Form.Item name="warehouseId" label="Almacén" rules={[{ required: true }]} style={{ minWidth: 320 }}>
        <Select showSearch optionFilterProp="label" loading={warehouses.isLoading} options={warehouses.data?.warehouses.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` }))} onChange={(value) => { setWarehouseId(value); form.setFieldValue('details', [{ direction: 'OUT', quantity: 1 }]); }} />
      </Form.Item>
      <Form.Item name="reason" label="Motivo" rules={[{ required: true, min: 3 }]} style={{ minWidth: 420 }}><Input maxLength={500} /></Form.Item>
    </Space>
    <Alert type="info" showIcon message="El borrador no modifica existencias" description="Los saldos y el Kardex cambiarán únicamente cuando un usuario autorizado apruebe el ajuste." style={{ marginBottom: 16 }} />
    <Form.List name="details">
      {(fields, { add, remove }) => <Space direction="vertical" style={{ width: '100%' }}>
        {fields.map((field, index) => <Space key={field.key} align="start" wrap>
          <Form.Item {...field} name={[field.name, 'inventoryLotId']} label={`Lote ${index + 1}`} rules={[{ required: true }]} style={{ width: 330 }}><Select showSearch optionFilterProp="label" loading={lots.isLoading} options={lotOptions} /></Form.Item>
          <Form.Item {...field} name={[field.name, 'locationId']} label="Ubicación" rules={[{ required: true }]} style={{ width: 220 }}><Select showSearch optionFilterProp="label" loading={locations.isLoading} options={locations.data?.locations.map((item) => ({ value: item.id, label: item.code }))} /></Form.Item>
          <Form.Item {...field} name={[field.name, 'direction']} label="Dirección" rules={[{ required: true }]}><Select style={{ width: 130 }} options={[{ value: 'IN', label: 'Entrada' }, { value: 'OUT', label: 'Salida' }]} /></Form.Item>
          <Form.Item {...field} name={[field.name, 'quantity']} label="Cantidad" rules={[{ required: true }]}><InputNumber min={0.0001} precision={4} /></Form.Item>
          <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} style={{ marginTop: 30 }} />
        </Space>)}
        <Button icon={<PlusOutlined />} onClick={() => add({ direction: 'OUT', quantity: 1 })} disabled={!warehouseId}>Agregar línea</Button>
      </Space>}
    </Form.List>
    <Form.Item name="notes" label="Observaciones" style={{ marginTop: 16 }}><Input.TextArea rows={3} maxLength={5000} /></Form.Item>
    <Space><Button onClick={onCancel}>Cancelar</Button><Button type="primary" htmlType="submit" loading={isSubmitting}>Crear borrador</Button></Space>
  </Form>;
}

