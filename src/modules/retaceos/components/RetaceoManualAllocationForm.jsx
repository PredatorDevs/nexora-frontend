import { Alert, Button, Form, InputNumber, Space, Table } from 'antd';

export function RetaceoManualAllocationForm({ retaceo, isSubmitting, onCancel, onSubmit }) {
  const [form] = Form.useForm();
  const costs = retaceo.costs.filter((item) => item.isCapitalizable && item.allocationMethod === 'MANUAL');
  async function finish(values) {
    await onSubmit(costs.map((cost) => ({
      retaceoCostId: cost.id,
      allocations: retaceo.details.map((detail) => ({
        retaceoDetailId: detail.id,
        amount: values.allocations?.[cost.id]?.[detail.id] ?? 0,
      })),
    })));
  }
  return <Form form={form} layout="vertical" onFinish={finish}>
    <Alert type="info" showIcon message="Distribuye cada costo manual por completo. La suma debe coincidir exactamente con el importe del costo." style={{ marginBottom: 16 }} />
    {costs.map((cost) => <Table key={cost.id} rowKey="id" pagination={false} dataSource={retaceo.details} style={{ marginBottom: 20 }} title={() => `${cost.expenseType.name} · ${cost.baseAmount} ${retaceo.currencyCode}`} columns={[
      { title: 'Producto', render: (_, item) => `${item.product.internalCode} · ${item.product.name}` },
      { title: 'FOB', dataIndex: 'fobTotal' },
      { title: 'Asignar', render: (_, item) => <Form.Item name={['allocations', cost.id, item.id]} rules={[{ required: true, message: 'Requerido' }]} style={{ margin: 0 }}><InputNumber min={0} precision={6} style={{ width: '100%' }} /></Form.Item> },
    ]} />)}
    <Space><Button onClick={onCancel}>Cancelar</Button><Button type="primary" htmlType="submit" loading={isSubmitting}>Calcular</Button></Space>
  </Form>;
}
