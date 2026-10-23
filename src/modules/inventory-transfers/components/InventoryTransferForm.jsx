import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Form, Input, InputNumber, Select, Space } from 'antd';
import { useState } from 'react';
import { listStock } from '@/modules/inventory/inventory.api.js';
import { listLocations } from '@/modules/locations/locations.api.js';
import { listWarehouses } from '@/modules/warehouses/warehouses.api.js';

export function InventoryTransferForm({ onCancel, onSubmit, isSubmitting }) {
  const [form] = Form.useForm();
  const [sourceWarehouseId, setSourceWarehouseId] = useState();
  const [destinationWarehouseId, setDestinationWarehouseId] = useState();
  const warehouses = useQuery({ queryKey: ['warehouses', 'transfer'], queryFn: () => listWarehouses({ page: 1, pageSize: 100, sortBy: 'name', sortOrder: 'asc', isActive: true }) });
  const stock = useQuery({ queryKey: ['inventory', 'transfer-stock', sourceWarehouseId], queryFn: () => listStock({ page: 1, pageSize: 100, sortBy: 'updatedAt', sortOrder: 'desc', warehouseId: sourceWarehouseId }), enabled: Boolean(sourceWarehouseId) });
  const locations = useQuery({ queryKey: ['locations', 'transfer-destination', destinationWarehouseId], queryFn: () => listLocations({ page: 1, pageSize: 100, sortBy: 'code', sortOrder: 'asc', isActive: true, warehouseId: destinationWarehouseId }), enabled: Boolean(destinationWarehouseId) });
  const sourceOptions = stock.data?.stock.map((item) => ({
    value: item.id,
    label: `${item.inventoryLot.code} · ${item.inventoryLot.product.name} · ${item.location.code} · disponible ${item.quantity}`,
    item,
  })) ?? [];
  async function finish(values) {
    await onSubmit({
      sourceWarehouseId: values.sourceWarehouseId,
      destinationWarehouseId: values.destinationWarehouseId,
      notes: values.notes?.trim() || null,
      details: values.details.map((line) => {
        const source = sourceOptions.find((option) => option.value === line.stockId)?.item;
        return {
          inventoryLotId: source.inventoryLot.id,
          sourceLocationId: source.location.id,
          destinationLocationId: line.destinationLocationId,
          quantity: line.quantity,
          notes: line.notes?.trim() || null,
        };
      }),
    });
  }
  return <Form form={form} layout="vertical" onFinish={finish} initialValues={{ details: [{}] }}>
    {(warehouses.error || stock.error || locations.error) ? <Alert type="error" showIcon message="No fue posible cargar los catálogos del traslado." style={{ marginBottom: 16 }} /> : null}
    <Space align="start" wrap style={{ width: '100%' }}>
      <Form.Item name="sourceWarehouseId" label="Almacén origen" rules={[{ required: true }]} style={{ minWidth: 300 }}>
        <Select showSearch optionFilterProp="label" loading={warehouses.isLoading} options={warehouses.data?.warehouses.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` }))} onChange={(value) => { setSourceWarehouseId(value); form.setFieldValue('details', [{}]); }} />
      </Form.Item>
      <Form.Item name="destinationWarehouseId" label="Almacén destino" dependencies={['sourceWarehouseId']} rules={[
        { required: true },
        ({ getFieldValue }) => ({ validator: (_, value) => !value || value !== getFieldValue('sourceWarehouseId') ? Promise.resolve() : Promise.reject(new Error('Debe ser diferente al almacén origen.')) }),
      ]} style={{ minWidth: 300 }}>
        <Select showSearch optionFilterProp="label" loading={warehouses.isLoading} options={warehouses.data?.warehouses.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}`, disabled: item.id === sourceWarehouseId }))} onChange={setDestinationWarehouseId} />
      </Form.Item>
    </Space>
    <Form.List name="details">
      {(fields, { add, remove }) => <Space direction="vertical" style={{ width: '100%' }}>
        {fields.map((field, index) => <Space key={field.key} align="start" wrap>
          <Form.Item {...field} name={[field.name, 'stockId']} label={`Lote / origen ${index + 1}`} rules={[{ required: true }]} style={{ width: 390 }}><Select showSearch optionFilterProp="label" options={sourceOptions} loading={stock.isLoading} /></Form.Item>
          <Form.Item {...field} name={[field.name, 'destinationLocationId']} label="Ubicación destino" rules={[{ required: true }]} style={{ width: 230 }}><Select showSearch optionFilterProp="label" options={locations.data?.locations.map((item) => ({ value: item.id, label: item.code }))} loading={locations.isLoading} /></Form.Item>
          <Form.Item {...field} name={[field.name, 'quantity']} label="Cantidad" rules={[{ required: true }]}><InputNumber min={0.0001} precision={4} /></Form.Item>
          <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} style={{ marginTop: 30 }} />
        </Space>)}
        <Button icon={<PlusOutlined />} onClick={() => add()} disabled={!sourceWarehouseId || !destinationWarehouseId}>Agregar línea</Button>
      </Space>}
    </Form.List>
    <Form.Item name="notes" label="Observaciones" style={{ marginTop: 16 }}><Input.TextArea rows={3} maxLength={5000} /></Form.Item>
    <Space><Button onClick={onCancel}>Cancelar</Button><Button type="primary" htmlType="submit" loading={isSubmitting}>Crear traslado</Button></Space>
  </Form>;
}
