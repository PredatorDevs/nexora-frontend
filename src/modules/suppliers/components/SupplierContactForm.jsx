import { Button, Checkbox, Form, Input, Space } from 'antd';

const nullable = (value) => value?.trim() || null;
export function SupplierContactForm({ initialValues, isSubmitting, onCancel, onSubmit }) {
  return (
    <Form
      layout="vertical"
      initialValues={{ isPrimary: false, ...initialValues }}
      onFinish={(values) => onSubmit({
        ...values,
        jobTitle: nullable(values.jobTitle), department: nullable(values.department),
        phone: nullable(values.phone), email: nullable(values.email), notes: nullable(values.notes),
      })}
    >
      <Form.Item name="fullName" label="Nombre completo" rules={[{ required: true }]}><Input maxLength={191} /></Form.Item>
      <Form.Item name="jobTitle" label="Cargo"><Input maxLength={120} /></Form.Item>
      <Form.Item name="department" label="Departamento o área"><Input maxLength={120} /></Form.Item>
      <Form.Item name="phone" label="Teléfono"><Input maxLength={30} /></Form.Item>
      <Form.Item name="email" label="Correo" rules={[{ type: 'email' }]}><Input /></Form.Item>
      {!initialValues ? <Form.Item name="isPrimary" valuePropName="checked"><Checkbox>Contacto principal</Checkbox></Form.Item> : null}
      <Form.Item name="notes" label="Observaciones"><Input.TextArea rows={3} maxLength={5000} /></Form.Item>
      <Space><Button onClick={onCancel}>Cancelar</Button><Button type="primary" htmlType="submit" loading={isSubmitting}>Guardar contacto</Button></Space>
    </Form>
  );
}
