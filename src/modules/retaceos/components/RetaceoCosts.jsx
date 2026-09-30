import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { App, Button, Checkbox, DatePicker, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { listExpenseTypes } from '@/modules/expense-types/expense-types.api.js';
import * as api from '../retaceos.api.js';

const categories = { FREIGHT: 'Flete', INSURANCE: 'Seguro', IMPORT_DUTY: 'DAI / arancel', OTHER: 'Otro', IMPORT_VAT: 'IVA de importación' };
const methods = { FOB_VALUE: 'Valor FOB', QUANTITY: 'Cantidad', WEIGHT: 'Peso', VOLUME: 'Volumen', CIF_VALUE: 'Valor CIF', EQUAL: 'Partes iguales', MANUAL: 'Manual' };
const nullable = (value) => value?.trim() || null;

export function RetaceoCosts({ retaceo, onChange }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const recoverableTax = Form.useWatch('isRecoverableTax', form);
  const selectedCategory = Form.useWatch('category', form);
  const types = useQuery({
    queryKey: ['expense-types', 'active-for-retaceo'],
    queryFn: () => listExpenseTypes({ page: 1, pageSize: 100, sortBy: 'name', sortOrder: 'asc', isActive: true }),
  });
  const open = (item = {}) => {
    setEditing(item);
    form.setFieldsValue(item.id ? {
      ...item,
      originalAmount: Number(item.originalAmount), exchangeRate: Number(item.exchangeRate),
      documentDate: item.documentDate ? dayjs(item.documentDate) : null,
      exchangeRateDate: item.exchangeRateDate ? dayjs(item.exchangeRateDate) : null,
    } : { currencyCode: retaceo.currencyCode, exchangeRate: 1, allocationMethod: 'FOB_VALUE', category: 'OTHER', isCapitalizable: true, isRecoverableTax: false, isCifComponent: false });
  };
  function selectType(id) {
    const type = types.data?.expenseTypes.find((item) => item.id === id);
    if (type) form.setFieldsValue({
      category: type.landedCostCategory,
      allocationMethod: type.defaultAllocationMethod,
      isCapitalizable: type.isCapitalizable && !type.isRecoverableTax
        && type.landedCostCategory !== 'IMPORT_VAT',
      isRecoverableTax: type.isRecoverableTax,
      isCifComponent: type.isCifComponent,
    });
  }
  async function save(values) {
    setBusy(true);
    try {
      const payload = {
        ...values,
        description: nullable(values.description), documentNumber: nullable(values.documentNumber),
        documentDate: values.documentDate?.format('YYYY-MM-DD') ?? null,
        exchangeRateDate: values.exchangeRateDate?.format('YYYY-MM-DD') ?? null,
      };
      if (editing.id) await api.updateRetaceoCost(retaceo, editing, payload);
      else await api.createRetaceoCost(retaceo, payload);
      message.success('Costo guardado.');
      setEditing(null); form.resetFields(); await onChange();
    } catch (error) { message.error(error.message); } finally { setBusy(false); }
  }
  async function remove(item) {
    try { await api.deleteRetaceoCost(retaceo, item); message.success('Costo eliminado.'); await onChange(); }
    catch (error) { message.error(error.message); }
  }
  return <>
    <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 20, marginBottom: 8 }}><strong>Costos del retaceo</strong><Button icon={<PlusOutlined />} onClick={() => open()}>Agregar costo</Button></Space>
    <Table rowKey="id" pagination={false} dataSource={retaceo.costs} scroll={{ x: 1100 }} columns={[
      { title: '#', dataIndex: 'lineNumber', width: 55 },
      { title: 'Tipo', render: (_, item) => item.expenseType.name },
      { title: 'Categoría', render: (_, item) => categories[item.category] },
      { title: 'Descripción', render: (_, item) => item.description || '—' },
      { title: 'Importe', render: (_, item) => `${Number(item.baseAmount).toLocaleString('es-SV', { minimumFractionDigits: 2 })} ${retaceo.currencyCode}` },
      { title: 'Distribución', render: (_, item) => methods[item.allocationMethod] },
      { title: 'Tratamiento', render: (_, item) => item.isRecoverableTax ? 'Impuesto recuperable' : item.isCapitalizable ? 'Capitalizable' : 'No capitalizable' },
      { title: 'Acciones', render: (_, item) => <Space><Button icon={<EditOutlined />} onClick={() => open(item)} /><Popconfirm title="¿Eliminar este costo?" onConfirm={() => remove(item)}><Button danger icon={<DeleteOutlined />} /></Popconfirm></Space> },
    ]} />
    <Modal title={editing?.id ? 'Editar costo' : 'Agregar costo'} open={Boolean(editing)} footer={null} onCancel={() => { setEditing(null); form.resetFields(); }} destroyOnHidden>
      <Form form={form} layout="vertical" onFinish={save}>
        <Form.Item name="expenseTypeId" label="Tipo de gasto" rules={[{ required: true }]}><Select loading={types.isLoading} options={types.data?.expenseTypes.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` }))} onChange={selectType} /></Form.Item>
        <Form.Item name="description" label="Descripción"><Input maxLength={500} /></Form.Item>
        <Space wrap align="start">
          <Form.Item name="currencyCode" label="Moneda" rules={[{ required: true }]}><Input maxLength={3} style={{ width: 100 }} /></Form.Item>
          <Form.Item name="originalAmount" label="Importe" rules={[{ required: true }]}><InputNumber min={0.000001} precision={6} /></Form.Item>
          <Form.Item name="exchangeRate" label="Tipo de cambio" rules={[{ required: true }]}><InputNumber min={0.00000001} precision={8} /></Form.Item>
          <Form.Item name="exchangeRateDate" label="Fecha de cambio"><DatePicker /></Form.Item>
        </Space>
        <Space wrap align="start">
          <Form.Item name="category" label="Categoría" rules={[{ required: true }]}><Select style={{ width: 190 }} options={Object.entries(categories).map(([value, label]) => ({ value, label }))} onChange={(value) => { if (value === 'IMPORT_VAT') form.setFieldsValue({ isCapitalizable: false, isRecoverableTax: true }); }} /></Form.Item>
          <Form.Item name="allocationMethod" label="Método" rules={[{ required: true }]}><Select style={{ width: 180 }} options={Object.entries(methods).map(([value, label]) => ({ value, label }))} /></Form.Item>
        </Space>
        <Space wrap><Form.Item name="isCapitalizable" valuePropName="checked"><Checkbox disabled={recoverableTax || selectedCategory === 'IMPORT_VAT'}>Capitalizable</Checkbox></Form.Item><Form.Item name="isRecoverableTax" valuePropName="checked"><Checkbox onChange={(event) => { if (event.target.checked) form.setFieldValue('isCapitalizable', false); }}>Impuesto recuperable</Checkbox></Form.Item><Form.Item name="isCifComponent" valuePropName="checked"><Checkbox>Componente CIF</Checkbox></Form.Item></Space>
        <Space wrap align="start"><Form.Item name="documentNumber" label="Documento"><Input maxLength={120} /></Form.Item><Form.Item name="documentDate" label="Fecha"><DatePicker /></Form.Item></Space>
        <Button type="primary" htmlType="submit" loading={busy}>Guardar costo</Button>
      </Form>
    </Modal>
  </>;
}
