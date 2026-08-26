import { useQuery } from '@tanstack/react-query';
import { Button, Form, Input, Select, Space } from 'antd';
import { apiClient } from '@/api/api-client.js';
const nullable = (v) => v?.trim() || null;
export function ProductUnitForm({
  initialValues,
  isSubmitting,
  onCancel,
  onSubmit,
}) {
  const units = useQuery({
    queryKey: ['measurement-units', 'product-unit-options'],
    queryFn: async () =>
      (
        await apiClient.get('/measurement-units', {
          params: {
            page: 1,
            pageSize: 100,
            sortBy: 'name',
            sortOrder: 'asc',
            activeOnly: true,
          },
        })
      ).data,
  });
  const options = (units.data ?? []).map((u) => ({
    value: u.id,
    label: `${u.name}${u.symbol ? ` (${u.symbol})` : ''}${u.mhCode ? ` · MH ${u.mhCode}` : ''}`,
  }));
  return (
    <Form
      layout="vertical"
      initialValues={initialValues ?? undefined}
      onFinish={(v) => onSubmit({ ...v, description: nullable(v.description) })}
    >
      <Form.Item
        name="name"
        label="Nombre comercial"
        extra="Ejemplo: Caja de 24, Saco o Unidad."
        rules={[{ required: true, whitespace: true }]}
      >
        <Input maxLength={120} />
      </Form.Item>
      <Form.Item name="type" label="Uso" rules={[{ required: true }]}>
        <Select
          options={[
            { value: 'PURCHASE', label: 'Compra' },
            { value: 'SALE', label: 'Venta' },
          ]}
        />
      </Form.Item>
      <Form.Item
        name="measurementUnitId"
        label="Unidad fiscal o física"
        rules={[{ required: true }]}
      >
        <Select
          showSearch
          optionFilterProp="label"
          loading={units.isLoading}
          options={options}
          placeholder="Selecciona una unidad"
        />
      </Form.Item>
      <Form.Item name="description" label="Descripción">
        <Input.TextArea maxLength={500} showCount rows={3} />
      </Form.Item>
      <Space>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button type="primary" htmlType="submit" loading={isSubmitting}>
          Guardar unidad
        </Button>
      </Space>
    </Form>
  );
}
