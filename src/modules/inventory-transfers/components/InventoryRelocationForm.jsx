import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Form, Input, InputNumber, Select, Space } from 'antd';
import { useState } from 'react';
import { listStock } from '@/modules/inventory/inventory.api.js';
import { listLocations } from '@/modules/locations/locations.api.js';
import { listWarehouses } from '@/modules/warehouses/warehouses.api.js';

export function InventoryRelocationForm({ onCancel, onSubmit, isSubmitting }) {
  const [form] = Form.useForm();
  const [warehouseId, setWarehouseId] = useState();
  const warehouses = useQuery({ queryKey: ['warehouses', 'relocation'], queryFn: () => listWarehouses({ page: 1, pageSize: 100, sortBy: 'name', sortOrder: 'asc', isActive: true }) });
  const stock = useQuery({ queryKey: ['inventory', 'relocation-stock', warehouseId], queryFn: () => listStock({ page: 1, pageSize: 100, sortBy: 'updatedAt', sortOrder: 'desc', warehouseId }), enabled: Boolean(warehouseId) });
  const locations = useQuery({ queryKey: ['locations', 'relocation', warehouseId], queryFn: () => listLocations({ page: 1, pageSize: 100, sortBy: 'code', sortOrder: 'asc', isActive: true, warehouseId }), enabled: Boolean(warehouseId) });
  const sourceOptions = stock.data?.stock.map((item) => ({ value: item.id, label: `${item.inventoryLot.code} · ${item.inventoryLot.product.name} · ${item.location.code} · disponible ${item.quantity}`, item })) ?? [];
  async function finish(values) {
    await onSubmit({
      warehouseId: values.warehouseId, reason: values.reason.trim(), notes: values.notes?.trim() || null,
      details: values.details.map((line) => {
        const source = sourceOptions.find((option) => option.value === line.stockId)?.item;
        return { inventoryLotId: source.inventoryLot.id, sourceLocationId: source.location.id, destinationLocationId: line.destinationLocationId, quantity: line.quantity, notes: line.notes?.trim() || null };
      }),
    });
  }
  return <Form form={form} layout="vertical" onFinish={finish} initialValues={{ details: [{}] }}>
    {(warehouses.error || stock.error || locations.error) ? <Alert type="error" showIcon message="No fue posible cargar los catálogos de reubicación." style={{ marginBottom: 16 }} /> : null}
    <Alert type="info" showIcon message="Movimiento interno inmediato" description="Al confirmar se descontará la ubicación origen y se incrementará la ubicación destino en una sola operación." style={{ marginBottom: 16 }} />
    <Space align="start" wrap>
      <Form.Item name="warehouseId" label="Almacén" rules={[{ required: true }]} style={{ minWidth: 320 }}><Select showSearch optionFilterProp="label" loading={warehouses.isLoading} options={warehouses.data?.warehouses.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` }))} onChange={(value) => { setWarehouseId(value); form.setFieldValue('details', [{}]); }} /></Form.Item>
      <Form.Item name="reason" label="Motivo" rules={[{ required: true, min: 3 }]} style={{ minWidth: 420 }}><Input maxLength={500} /></Form.Item>
    </Space>
    <Form.List name="details">
      {(fields, { add, remove }) => <Space direction="vertical" style={{ width: '100%' }}>
        {fields.map((field, index) => <Space key={field.key} align="start" wrap>
          <Form.Item {...field} name={[field.name, 'stockId']} label={`Lote / origen ${index + 1}`} rules={[{ required: true }]} style={{ width: 390 }}><Select showSearch optionFilterProp="label" options={sourceOptions} loading={stock.isLoading} /></Form.Item>
          <Form.Item {...field} name={[field.name, 'destinationLocationId']} label="Ubicación destino" rules={[{ required: true }]} style={{ width: 230 }}><Select showSearch optionFilterProp="label" options={locations.data?.locations.map((item) => ({ value: item.id, label: item.code }))} loading={locations.isLoading} /></Form.Item>
          <Form.Item {...field} name={[field.name, 'quantity']} label="Cantidad" rules={[{ required: true }]}><InputNumber min={0.0001} precision={4} /></Form.Item>
          <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} style={{ marginTop: 30 }} />
        </Space>)}
        <Button icon={<PlusOutlined />} onClick={() => add()} disabled={!warehouseId}>Agregar línea</Button>
      </Space>}
    </Form.List>
    <Form.Item name="notes" label="Observaciones" style={{ marginTop: 16 }}><Input.TextArea rows={3} maxLength={5000} /></Form.Item>
    <Space><Button onClick={onCancel}>Cancelar</Button><Button type="primary" htmlType="submit" loading={isSubmitting}>Confirmar reubicación</Button></Space>
  </Form>;
}
