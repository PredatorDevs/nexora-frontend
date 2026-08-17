import { Button, Form, Input, Space } from 'antd';

const nullable = (value) => value?.trim() || null;

export function WarehouseCategoryForm({ initialValues, isSubmitting, onCancel, onSubmit }) {
  return (
    <Form
      layout="vertical"
      initialValues={initialValues ?? undefined}
      onFinish={(values) => onSubmit({ ...values, description: nullable(values.description) })}
    >
      <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
        <Input maxLength={120} />
      </Form.Item>
      <Form.Item name="description" label="Descripción">
        <Input.TextArea maxLength={500} showCount rows={3} />
      </Form.Item>
      <Space>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button type="primary" htmlType="submit" loading={isSubmitting}>
          Guardar categoría
        </Button>
      </Space>
    </Form>
  );
}
