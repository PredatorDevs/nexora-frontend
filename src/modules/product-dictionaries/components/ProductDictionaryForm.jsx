import { Button, Form, Input, Select, Space } from 'antd';
const nullable = (value) => value?.trim() || null;
export function ProductDictionaryForm({
  kind,
  initialValues,
  parentOptions = [],
  isSubmitting,
  onCancel,
  onSubmit,
}) {
  return (
    <Form
      layout="vertical"
      initialValues={initialValues ?? undefined}
      onFinish={(values) =>
        onSubmit({
          ...values,
          description: nullable(values.description),
          ...(kind === 'brand' ? { website: nullable(values.website) } : {}),
        })
      }
    >
      <Form.Item
        name="name"
        label="Nombre"
        rules={[{ required: true, whitespace: true }]}
      >
        <Input maxLength={120} />
      </Form.Item>
      {kind === 'category' ? (
        <Form.Item
          name="parentCategoryId"
          label="Categoría padre"
          extra="Déjalo vacío para crear una categoría principal."
        >
          <Select
            allowClear
            options={parentOptions}
            placeholder="Categoría principal"
          />
        </Form.Item>
      ) : null}
      {kind === 'brand' ? (
        <Form.Item
          name="website"
          label="Sitio web"
          rules={[{ type: 'url', warningOnly: false }]}
        >
          <Input maxLength={500} placeholder="https://" />
        </Form.Item>
      ) : null}
      <Form.Item name="description" label="Descripción">
        <Input.TextArea maxLength={500} showCount rows={3} />
      </Form.Item>
      <Space>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button type="primary" htmlType="submit" loading={isSubmitting}>
          Guardar
        </Button>
      </Space>
    </Form>
  );
}
