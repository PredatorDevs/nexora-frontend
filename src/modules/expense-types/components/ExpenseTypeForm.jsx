import { Button, Form, Input, Select, Space, Switch } from 'antd';

const categoryOptions = [
  { value: 'FREIGHT', label: 'Flete' },
  { value: 'INSURANCE', label: 'Seguro' },
  { value: 'IMPORT_DUTY', label: 'DAI / arancel de importación' },
  { value: 'OTHER', label: 'Otro gasto' },
  { value: 'IMPORT_VAT', label: 'IVA de importación' },
];
const allocationOptions = [
  { value: 'FOB_VALUE', label: 'Valor FOB' },
  { value: 'QUANTITY', label: 'Cantidad' },
  { value: 'WEIGHT', label: 'Peso' },
  { value: 'VOLUME', label: 'Volumen' },
  { value: 'CIF_VALUE', label: 'Valor CIF' },
  { value: 'EQUAL', label: 'Partes iguales' },
  { value: 'MANUAL', label: 'Asignación manual' },
];
export function ExpenseTypeForm({
  initialValues,
  isSubmitting,
  onCancel,
  onSubmit,
}) {
  return (
    <Form
      layout="vertical"
      initialValues={
        initialValues ?? {
          landedCostCategory: 'OTHER',
          defaultAllocationMethod: 'FOB_VALUE',
          isCapitalizable: false,
          isRecoverableTax: false,
          isCifComponent: false,
        }
      }
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
      <Form.Item
        name="landedCostCategory"
        label="Categoría para retaceo"
        rules={[{ required: true }]}
      >
        <Select options={categoryOptions} />
      </Form.Item>
      <Form.Item
        name="defaultAllocationMethod"
        label="Distribución predeterminada"
        rules={[{ required: true }]}
      >
        <Select options={allocationOptions} />
      </Form.Item>
      <Space wrap size="large">
        <Form.Item
          name="isCapitalizable"
          label="Capitalizable"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
        <Form.Item
          name="isRecoverableTax"
          label="Impuesto recuperable"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
        <Form.Item
          name="isCifComponent"
          label="Forma parte del CIF"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Space>
      <Space>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button type="primary" htmlType="submit" loading={isSubmitting}>
          Guardar tipo
        </Button>
      </Space>
    </Form>
  );
}
