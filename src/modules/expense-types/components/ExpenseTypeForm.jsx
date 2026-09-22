import { Button, Form, Input, Space } from 'antd';
export function ExpenseTypeForm({
  initialValues,
  isSubmitting,
  onCancel,
  onSubmit,
}) {
  return (
    <Form
      layout="vertical"
      initialValues={initialValues ?? undefined}
      onFinish={(values) =>
        onSubmit({ ...values, description: values.description?.trim() || null })
      }
    >
      <Form.Item
        name="name"
        label="Nombre"
        rules={[{ required: true, whitespace: true }]}
      >
        <Input maxLength={120} />
      </Form.Item>
      <Form.Item name="description" label="Descripción">
        <Input.TextArea maxLength={500} showCount rows={3} />
      </Form.Item>
      <Space>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button type="primary" htmlType="submit" loading={isSubmitting}>
          Guardar tipo
        </Button>
      </Space>
    </Form>
  );
}
