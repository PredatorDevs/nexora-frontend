import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, InputNumber, Select, Space } from 'antd';

export function PurchaseQuotationExpensesForm({
  quotation,
  expenseTypes,
  isSubmitting,
  onCancel,
  onSubmit,
}) {
  const options = expenseTypes.map((item) => ({
    value: item.id,
    label: `${item.code} · ${item.name}`,
  }));
  return (
    <Form
      layout="vertical"
      initialValues={{
        expenses: quotation.expenses?.map((item) => ({
          expenseTypeId: item.expenseTypeId,
          description: item.description,
          amount: Number(item.amount),
        })),
      }}
      onFinish={({ expenses = [] }) => onSubmit(expenses)}
    >
      <Alert
        type="info"
        showIcon
        message={`Los importes se registran en ${quotation.currencyCode}`}
        description="Los gastos se suman al total de productos para obtener el costo comparativo, sin alterar el cálculo fiscal de la cotización."
        style={{ marginBottom: 16 }}
      />
      <Form.List name="expenses">
        {(fields, { add, remove }) => (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {fields.map((field) => (
              <Space key={field.key} align="start" wrap>
                <Form.Item
                  name={[field.name, 'expenseTypeId']}
                  label="Tipo de gasto"
                  rules={[{ required: true, message: 'Selecciona el tipo.' }]}
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={options}
                    style={{ width: 280 }}
                  />
                </Form.Item>
                <Form.Item
                  name={[field.name, 'description']}
                  label="Descripción"
                >
                  <Input maxLength={500} style={{ width: 360 }} />
                </Form.Item>
                <Form.Item
                  name={[field.name, 'amount']}
                  label="Importe"
                  rules={[{ required: true, message: 'Indica el importe.' }]}
                >
                  <InputNumber
                    min={0.000001}
                    precision={6}
                    addonAfter={quotation.currencyCode}
                    style={{ width: 220 }}
                  />
                </Form.Item>
                <Button
                  danger
                  type="text"
                  aria-label="Quitar gasto"
                  icon={<MinusCircleOutlined />}
                  onClick={() => remove(field.name)}
                  style={{ marginTop: 30 }}
                />
              </Space>
            ))}
            <Button icon={<PlusOutlined />} onClick={() => add()}>
              Agregar gasto
            </Button>
          </Space>
        )}
      </Form.List>
      <Space style={{ marginTop: 24 }}>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button type="primary" htmlType="submit" loading={isSubmitting}>
          Guardar gastos
        </Button>
      </Space>
    </Form>
  );
}
