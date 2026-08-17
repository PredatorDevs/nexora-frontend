import { useQuery } from '@tanstack/react-query';
import { Button, Form, Input, Select, Space } from 'antd';
import * as branchesApi from '@/modules/branches/branches.api.js';
import * as categoriesApi from '@/modules/warehouse-categories/warehouse-categories.api.js';

const listOptions = { page: 1, pageSize: 100, sortBy: 'name', sortOrder: 'asc' };
const nullable = (value) => value?.trim() || null;

export function WarehouseForm({ initialValues, isSubmitting, onCancel, onSubmit }) {
  const branches = useQuery({
    queryKey: ['branches', 'warehouse-options'],
    queryFn: () => branchesApi.listBranches(listOptions),
    staleTime: 300_000,
  });
  const categories = useQuery({
    queryKey: ['warehouse-categories', 'warehouse-options'],
    queryFn: () => categoriesApi.listWarehouseCategories(listOptions),
    staleTime: 300_000,
  });
  const branchOptions = branches.data?.branches.map((item) => ({
    value: item.id,
    label: `${item.code} — ${item.name}`,
    disabled: item.status !== 'ACTIVE',
  }));
  const categoryOptions = categories.data?.warehouseCategories.map((item) => ({
    value: item.id,
    label: item.name,
    disabled: !item.isActive,
  }));
  return (
    <Form
      layout="vertical"
      initialValues={initialValues ?? undefined}
      onFinish={(values) => onSubmit({ ...values, description: nullable(values.description) })}
    >
      <Form.Item name="branchId" label="Sucursal" rules={[{ required: true }]}>
        <Select showSearch optionFilterProp="label" loading={branches.isLoading} options={branchOptions} />
      </Form.Item>
      <Form.Item name="warehouseCategoryId" label="Categoría" rules={[{ required: true }]}>
        <Select showSearch optionFilterProp="label" loading={categories.isLoading} options={categoryOptions} />
      </Form.Item>
      <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
        <Input maxLength={191} />
      </Form.Item>
      <Form.Item name="description" label="Descripción">
        <Input.TextArea maxLength={500} showCount rows={3} />
      </Form.Item>
      <Space>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button type="primary" htmlType="submit" loading={isSubmitting}>
          Guardar almacén
        </Button>
      </Space>
    </Form>
  );
}
