import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import * as api from '../purchases.api.js';
export function PurchaseForm({
  initialValues,
  isSubmitting,
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();
  const [selectedOrderId, setSelectedOrderId] = useState(
    initialValues?.purchaseOrderId,
  );
  const orders = useQuery({
    queryKey: ['purchase-orders', 'receivable'],
    queryFn: api.listReceivableOrders,
    enabled: !initialValues,
  });
  const availability = useQuery({
    queryKey: ['purchases', 'availability', selectedOrderId, initialValues?.id],
    queryFn: () =>
      api.getPurchaseAvailability(selectedOrderId, initialValues?.id),
    enabled: Boolean(selectedOrderId),
  });
  useEffect(() => {
    if (!initialValues) return;
    form.setFieldsValue({
      purchaseOrderId: initialValues.purchaseOrderId,
      purchaseDate: dayjs(initialValues.purchaseDate),
      supplierInvoiceNumber: initialValues.supplierInvoiceNumber,
      supplierInvoiceDate: initialValues.supplierInvoiceDate
        ? dayjs(initialValues.supplierInvoiceDate)
        : null,
      notes: initialValues.notes,
      quantities: Object.fromEntries(
        initialValues.details.map((x) => [
          x.purchaseOrderDetailId,
          Number(x.quantityReceived),
        ]),
      ),
      detailNotes: Object.fromEntries(
        initialValues.details.map((x) => [x.purchaseOrderDetailId, x.notes]),
      ),
    });
  }, [form, initialValues]);
  const rows = availability.data?.details ?? [];
  async function finish(values) {
    const details = rows
      .map((row) => ({
        purchaseOrderDetailId: row.id,
        quantityReceived: values.quantities?.[row.id],
        notes: values.detailNotes?.[row.id] || null,
      }))
      .filter((row) => Number(row.quantityReceived) > 0);
    if (!details.length) {
      form.setFields([
        {
          name: 'quantities',
          errors: ['Ingresa al menos una cantidad a recibir.'],
        },
      ]);
      return;
    }
    await onSubmit({
      purchaseOrderId: values.purchaseOrderId,
      expectedOrderUpdatedAt: availability.data.purchaseOrder.updatedAt,
      purchaseDate: values.purchaseDate.toISOString(),
      supplierInvoiceNumber: values.supplierInvoiceNumber?.trim() || null,
      supplierInvoiceDate:
        values.supplierInvoiceDate?.format('YYYY-MM-DD') ?? null,
      notes: values.notes?.trim() || null,
      details,
    });
  }
  return (
    <Form form={form} layout="vertical" onFinish={finish}>
      <Form.Item
        name="purchaseOrderId"
        label="Orden de compra"
        rules={[{ required: true }]}
      >
        <Select
          disabled={Boolean(initialValues)}
          showSearch
          optionFilterProp="label"
          loading={orders.isLoading}
          options={orders.data?.map((x) => ({
            value: x.id,
            label: `${x.code} · ${x.supplier.name} · ${x.warehouse.name}`,
          }))}
          onChange={(value) => {
            setSelectedOrderId(value);
            form.setFieldValue('quantities', {});
          }}
        />
      </Form.Item>
      {availability.error ? (
        <Alert type="error" showIcon message={availability.error.message} />
      ) : null}
      {availability.data ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={`${availability.data.purchaseOrder.supplier.name} · ${availability.data.purchaseOrder.branch.name} / ${availability.data.purchaseOrder.warehouse.name} · ${availability.data.purchaseOrder.currencyCode}`}
        />
      ) : null}
      <Space size="middle" wrap style={{ width: '100%' }}>
        <Form.Item
          name="purchaseDate"
          label="Fecha y hora de recepción"
          rules={[{ required: true }]}
        >
          <DatePicker showTime />
        </Form.Item>
        <Form.Item name="supplierInvoiceNumber" label="Factura del proveedor">
          <Input maxLength={100} />
        </Form.Item>
        <Form.Item name="supplierInvoiceDate" label="Fecha de factura">
          <DatePicker />
        </Form.Item>
      </Space>
      <Form.Item name="notes" label="Observaciones">
        <Input.TextArea rows={3} maxLength={5000} showCount />
      </Form.Item>
      <Table
        rowKey="id"
        pagination={false}
        loading={availability.isLoading}
        dataSource={rows}
        scroll={{ x: 850 }}
        columns={[
          { title: '#', dataIndex: 'lineNumber', width: 55 },
          {
            title: 'Producto',
            render: (_, x) => `${x.product.internalCode} · ${x.product.name}`,
          },
          { title: 'Unidad', render: (_, x) => x.productUnit.name },
          { title: 'Ordenado', dataIndex: 'quantityOrdered' },
          { title: 'Reservado', dataIndex: 'quantityReserved' },
          { title: 'Disponible', dataIndex: 'quantityAvailable' },
          {
            title: 'A recibir',
            render: (_, x) => (
              <Form.Item name={['quantities', x.id]} style={{ margin: 0 }}>
                <InputNumber
                  min={0}
                  max={Number(x.quantityAvailable)}
                  precision={4}
                />
              </Form.Item>
            ),
          },
          {
            title: 'Notas',
            render: (_, x) => (
              <Form.Item name={['detailNotes', x.id]} style={{ margin: 0 }}>
                <Input maxLength={5000} />
              </Form.Item>
            ),
          },
        ]}
      />
      <Space style={{ marginTop: 16 }}>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button
          type="primary"
          htmlType="submit"
          loading={isSubmitting}
          disabled={!availability.data}
        >
          Guardar borrador
        </Button>
      </Space>
    </Form>
  );
}
