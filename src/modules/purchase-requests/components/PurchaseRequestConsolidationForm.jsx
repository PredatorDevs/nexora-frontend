import { useQuery } from '@tanstack/react-query';
import { Alert, Button, DatePicker, Form, Input, Select, Space, Table } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import * as branchesApi from '@/modules/branches/branches.api.js';
import * as warehousesApi from '@/modules/warehouses/warehouses.api.js';

const params = { page: 1, pageSize: 100, sortBy: 'name', sortOrder: 'asc' };

export function PurchaseRequestConsolidationForm({
  requests,
  isSubmitting,
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();
  const [branchId, setBranchId] = useState();
  const branches = useQuery({
    queryKey: ['branches', 'purchase-request-consolidation-options'],
    queryFn: () => branchesApi.listBranches({ ...params, status: 'ACTIVE' }),
  });
  const warehouses = useQuery({
    queryKey: ['warehouses', 'purchase-request-consolidation-options', branchId],
    queryFn: () =>
      warehousesApi.listWarehouses({ ...params, branchId, isActive: true }),
    enabled: Boolean(branchId),
  });
  const products = new Map();
  requests.forEach((request) =>
    request.details.forEach((detail) => {
      const key = `${detail.productId}:${detail.productUnitId}`;
      const current = products.get(key);
      products.set(key, {
        key,
        product: detail.product,
        productUnit: detail.productUnit,
        quantity: Number(current?.quantity ?? 0) + Number(detail.quantity),
      });
    }),
  );

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ requiredDate: dayjs().add(1, 'day') }}
      onFinish={(values) =>
        onSubmit({
          sourceRequestIds: requests.map((request) => request.id),
          branchId: values.branchId,
          warehouseId: values.warehouseId,
          requiredDate: values.requiredDate.startOf('day').toISOString(),
          justification: values.justification.trim(),
          notes: values.notes?.trim() || null,
        })
      }
    >
      <Alert
        type="info"
        showIcon
        message={`${requests.length} solicitudes serán consolidadas completamente.`}
        description="Las solicitudes originales quedarán cerradas como consolidadas y se creará un nuevo borrador que deberá aprobarse antes de cotizarse."
        style={{ marginBottom: 16 }}
      />
      <Space wrap size="middle" style={{ width: '100%' }}>
        <Form.Item name="branchId" label="Sucursal destino" rules={[{ required: true }]}>
          <Select
            showSearch
            optionFilterProp="label"
            loading={branches.isLoading}
            style={{ width: 320 }}
            options={branches.data?.branches.map((item) => ({
              value: item.id,
              label: `${item.code} · ${item.name}`,
            }))}
            onChange={(value) => {
              setBranchId(value);
              form.setFieldValue('warehouseId', undefined);
            }}
          />
        </Form.Item>
        <Form.Item name="warehouseId" label="Almacén destino" rules={[{ required: true }]}>
          <Select
            showSearch
            optionFilterProp="label"
            disabled={!branchId}
            loading={warehouses.isLoading}
            style={{ width: 320 }}
            options={warehouses.data?.warehouses.map((item) => ({
              value: item.id,
              label: `${item.code} · ${item.name}`,
            }))}
          />
        </Form.Item>
        <Form.Item name="requiredDate" label="Fecha requerida" rules={[{ required: true }]}>
          <DatePicker disabledDate={(date) => date?.endOf('day').isBefore(dayjs())} />
        </Form.Item>
      </Space>
      <Form.Item name="justification" label="Justificación" rules={[{ required: true, whitespace: true }]}>
        <Input maxLength={5000} />
      </Form.Item>
      <Form.Item name="notes" label="Notas">
        <Input.TextArea rows={2} maxLength={5000} />
      </Form.Item>
      <Table
        rowKey="key"
        size="small"
        pagination={false}
        dataSource={[...products.values()]}
        columns={[
          { title: 'Producto', render: (_, row) => `${row.product.internalCode} · ${row.product.name}` },
          { title: 'Cantidad consolidada', dataIndex: 'quantity' },
          { title: 'Unidad', render: (_, row) => row.productUnit.name },
        ]}
        style={{ marginBottom: 16 }}
      />
      <Space>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button type="primary" htmlType="submit" loading={isSubmitting}>
          Crear solicitud consolidada
        </Button>
      </Space>
    </Form>
  );
}
