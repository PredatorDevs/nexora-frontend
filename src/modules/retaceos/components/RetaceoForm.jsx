import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Checkbox, Col, DatePicker, Form, Input, InputNumber, Row, Select, Space, Table } from 'antd';
import dayjs from 'dayjs';
import * as catalogs from '@/modules/companies/catalogs.api.js';
import * as api from '../retaceos.api.js';

const nullable = (value) => value?.trim() || null;
const dateValue = (value) => value ? dayjs(value) : null;

export function RetaceoForm({ initialValues, isSubmitting, onCancel, onSubmit }) {
  const [form] = Form.useForm();
  const countries = useQuery({
    queryKey: ['catalogs', 'countries'], queryFn: catalogs.listCountries, staleTime: 300_000,
  });
  const purchases = useQuery({
    queryKey: ['retaceos', 'eligible-purchases'],
    queryFn: () => api.listEligiblePurchases({ page: 1, pageSize: 100, sortBy: 'purchaseDate', sortOrder: 'desc' }),
    enabled: !initialValues,
  });
  const details = initialValues?.details ?? [];
  async function finish(values) {
    const common = {
      originCountryId: values.originCountryId,
      retaceoDate: values.retaceoDate.toISOString(),
      importInvoiceNumber: nullable(values.importInvoiceNumber),
      importInvoiceDate: values.importInvoiceDate?.format('YYYY-MM-DD') ?? null,
      importPolicyNumber: nullable(values.importPolicyNumber),
      importPolicyDate: values.importPolicyDate?.format('YYYY-MM-DD') ?? null,
      notes: nullable(values.notes),
    };
    await onSubmit(initialValues ? {
      ...common,
      details: details.map((item) => ({
        retaceoDetailId: item.id,
        weight: values.weights?.[item.id] ?? null,
        volume: values.volumes?.[item.id] ?? null,
      })),
    } : {
      ...common,
      purchaseId: values.purchaseId,
      includeOrderExpenses: values.includeOrderExpenses,
    });
  }
  return (
    <Form form={form} layout="vertical" onFinish={finish} initialValues={initialValues ? {
      originCountryId: initialValues.originCountryId,
      retaceoDate: dateValue(initialValues.retaceoDate),
      importInvoiceNumber: initialValues.importInvoiceNumber,
      importInvoiceDate: dateValue(initialValues.importInvoiceDate),
      importPolicyNumber: initialValues.importPolicyNumber,
      importPolicyDate: dateValue(initialValues.importPolicyDate),
      notes: initialValues.notes,
      weights: Object.fromEntries(details.map((item) => [item.id, item.weight == null ? null : Number(item.weight)])),
      volumes: Object.fromEntries(details.map((item) => [item.id, item.volume == null ? null : Number(item.volume)])),
    } : { retaceoDate: dayjs(), includeOrderExpenses: true }}>
      {(countries.error || purchases.error) ? <Alert type="error" showIcon message="No fue posible cargar los catálogos." style={{ marginBottom: 16 }} /> : null}
      {!initialValues ? <Form.Item name="purchaseId" label="Compra verificada" rules={[{ required: true }]}>
        <Select showSearch optionFilterProp="label" loading={purchases.isLoading} options={purchases.data?.purchases.map((item) => ({
          value: item.id,
          label: `${item.code} · ${item.supplier.name} · ${item.supplierInvoiceNumber || 'sin factura'} · ${item.currencyCode}`,
        }))} />
      </Form.Item> : <Alert type="info" showIcon message={`${initialValues.purchase.code} · ${initialValues.supplier.name} · ${initialValues.currencyCode}`} style={{ marginBottom: 16 }} />}
      <Row gutter={16}>
        <Col xs={24} md={12}><Form.Item name="originCountryId" label="País de origen" rules={[{ required: true }]}>
          <Select showSearch optionFilterProp="label" loading={countries.isLoading} options={countries.data?.map((item) => ({ value: item.id, label: item.name }))} />
        </Form.Item></Col>
        <Col xs={24} md={12}><Form.Item name="retaceoDate" label="Fecha del retaceo" rules={[{ required: true }]}><DatePicker showTime style={{ width: '100%' }} /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item name="importInvoiceNumber" label="Factura de importación"><Input maxLength={120} /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item name="importInvoiceDate" label="Fecha de factura"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item name="importPolicyNumber" label="Póliza de importación"><Input maxLength={120} /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item name="importPolicyDate" label="Fecha de póliza"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
      </Row>
      <Form.Item name="notes" label="Observaciones"><Input.TextArea rows={3} maxLength={5000} showCount /></Form.Item>
      {!initialValues ? <Form.Item name="includeOrderExpenses" valuePropName="checked"><Checkbox>Copiar los gastos definitivos de la orden de compra</Checkbox></Form.Item> : null}
      {initialValues ? <Table rowKey="id" pagination={false} dataSource={details} scroll={{ x: 850 }} columns={[
        { title: '#', dataIndex: 'lineNumber', width: 55 },
        { title: 'Producto', render: (_, item) => `${item.product.internalCode} · ${item.product.name}` },
        { title: 'Cantidad', dataIndex: 'quantity' },
        { title: 'FOB', dataIndex: 'fobTotal' },
        { title: 'Peso', render: (_, item) => <Form.Item name={['weights', item.id]} style={{ margin: 0 }}><InputNumber min={0} precision={6} /></Form.Item> },
        { title: 'Volumen', render: (_, item) => <Form.Item name={['volumes', item.id]} style={{ margin: 0 }}><InputNumber min={0} precision={6} /></Form.Item> },
      ]} /> : null}
      <Space style={{ marginTop: 16 }}><Button onClick={onCancel}>Cancelar</Button><Button type="primary" htmlType="submit" loading={isSubmitting}>Guardar borrador</Button></Space>
    </Form>
  );
}
