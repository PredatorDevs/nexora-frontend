import {
  DeleteOutlined,
  EditOutlined,
  FilePdfOutlined,
  PlusOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App,
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useState } from 'react';
import { Can } from '@/components/authorization/Can.jsx';
import { permissions } from '@/config/permissions.js';
import * as suppliersApi from '@/modules/suppliers/suppliers.api.js';
import * as api from '../purchase-requests.api.js';

const catalogParams = {
  page: 1,
  pageSize: 100,
  sortBy: 'name',
  sortOrder: 'asc',
};
const statusLabels = { DRAFT: 'Borrador', ISSUED: 'Emitido', CANCELLED: 'Cancelado' };
const statusColors = { DRAFT: 'default', ISSUED: 'success', CANCELLED: 'error' };

export function PurchaseRequestSegments({ request }) {
  const { message, modal } = App.useApp();
  const client = useQueryClient();
  const [editor, setEditor] = useState(null);
  const [form] = Form.useForm();
  const supplierId = Form.useWatch('supplierId', form);
  const canCreate = ['APPROVED', 'IN_QUOTATION'].includes(request.status);
  const segments = useQuery({
    queryKey: ['purchase-requests', request.id, 'segments'],
    queryFn: () => api.listPurchaseRequestSegments(request.id),
  });
  const suppliers = useQuery({
    queryKey: ['suppliers', 'segment-options'],
    queryFn: () => suppliersApi.listSuppliers(catalogParams),
    staleTime: 300_000,
  });
  const contacts = useQuery({
    queryKey: ['supplier-contacts', 'segment-options', supplierId],
    queryFn: () => suppliersApi.listSupplierContacts(supplierId, {
      ...catalogParams,
      sortBy: 'fullName',
      isActive: true,
    }),
    enabled: Boolean(supplierId),
    staleTime: 300_000,
  });
  const save = useMutation({
    mutationFn: ({ current, data }) => current
      ? api.updatePurchaseRequestSegment(request.id, current, data)
      : api.createPurchaseRequestSegment(request.id, data),
  });
  const transition = useMutation({
    mutationFn: ({ segment, action, reason }) =>
      api.transitionPurchaseRequestSegment(request.id, segment, action, reason),
  });
  const refresh = () => client.invalidateQueries({
    queryKey: ['purchase-requests', request.id, 'segments'],
  });
  const openEditor = (segment) => {
    const selected = new Map(
      segment?.details.map((item) => [item.purchaseRequestDetailId, item]) ?? [],
    );
    form.setFieldsValue({
      supplierId: segment?.supplierId,
      supplierContactId: segment?.supplierContactId,
      notes: segment?.notes,
      details: request.details.map((detail) => ({
        selected: segment ? selected.has(detail.id) : true,
        purchaseRequestDetailId: detail.id,
        quantity: selected.get(detail.id)?.quantity ?? detail.quantity,
        notes: selected.get(detail.id)?.notes,
      })),
    });
    setEditor(segment ?? 'create');
  };
  const submit = async (values) => {
    const details = values.details
      .map((item, index) => ({ item, detail: request.details[index] }))
      .filter(({ item }) => item.selected)
      .map(({ item, detail }) => ({
        purchaseRequestDetailId: detail.id,
        quantity: item.quantity,
        notes: item.notes,
      }));
    if (!details.length) return message.warning('Selecciona al menos una línea.');
    try {
      await save.mutateAsync({
        current: editor === 'create' ? null : editor,
        data: { ...values, details },
      });
      await refresh();
      setEditor(null);
      form.resetFields();
      message.success('Segmento guardado.');
    } catch (error) {
      message.error(error.message);
    }
  };
  const change = async (segment, action, reason) => {
    try {
      await transition.mutateAsync({ segment, action, reason });
      await refresh();
      message.success(action === 'issue' ? 'Segmento emitido.' : 'Segmento cancelado.');
    } catch (error) {
      message.error(error.message);
    }
  };
  const cancel = (segment) => {
    let reason = '';
    modal.confirm({
      title: 'Cancelar segmento',
      content: <Input.TextArea rows={3} placeholder="Motivo obligatorio" onChange={(event) => { reason = event.target.value; }} />,
      okButtonProps: { danger: true },
      okText: 'Cancelar segmento',
      onOk: async () => {
        if (!reason.trim()) throw new Error('Ingresa un motivo.');
        await change(segment, 'cancel', reason.trim());
      },
    });
  };
  return <Card
    size="small"
    title="Segmentos por proveedor"
    style={{ marginTop: 16 }}
    extra={canCreate ? <Can permission={permissions.purchaseRequests.manageSegments}><Button icon={<PlusOutlined />} onClick={() => openEditor(null)}>Agregar proveedor</Button></Can> : null}
  >
    <Typography.Paragraph type="secondary">
      Cada segmento genera una solicitud dirigida a un proveedor. Una misma línea puede enviarse a varios proveedores para comparar sus cotizaciones.
    </Typography.Paragraph>
    <Table
      rowKey="id"
      loading={segments.isLoading}
      dataSource={segments.data}
      pagination={false}
      columns={[
        { title: 'Segmento', dataIndex: 'code' },
        { title: 'Proveedor', render: (_, item) => `${item.supplier.code} · ${item.supplier.name}` },
        { title: 'Contacto', render: (_, item) => item.supplierContact?.fullName ?? '—' },
        { title: 'Líneas', render: (_, item) => item.details.length },
        { title: 'Estado', render: (_, item) => <Tag color={statusColors[item.status]}>{statusLabels[item.status]}</Tag> },
        { title: 'Acciones', render: (_, item) => <Space wrap>
          {item.status === 'DRAFT' ? <Can permission={permissions.purchaseRequests.manageSegments}><Button icon={<EditOutlined />} onClick={() => openEditor(item)} /></Can> : null}
          {item.status === 'DRAFT' ? <Can permission={permissions.purchaseRequests.manageSegments}><Popconfirm title="¿Emitir y congelar este segmento?" onConfirm={() => change(item, 'issue')}><Button type="primary" icon={<SendOutlined />}>Emitir</Button></Popconfirm></Can> : null}
          {item.status === 'ISSUED' ? <Button icon={<FilePdfOutlined />} onClick={() => api.downloadPurchaseRequestSegmentPdf(request.id, item)}>PDF</Button> : null}
          {item.status !== 'CANCELLED' ? <Can permission={permissions.purchaseRequests.manageSegments}><Button danger icon={<DeleteOutlined />} onClick={() => cancel(item)}>Cancelar</Button></Can> : null}
        </Space> },
      ]}
    />
    <Modal
      title={editor === 'create' ? 'Nuevo segmento por proveedor' : 'Editar segmento'}
      open={Boolean(editor)}
      footer={null}
      width={950}
      destroyOnHidden
      onCancel={() => { setEditor(null); form.resetFields(); }}
    >
      <Form form={form} layout="vertical" onFinish={submit}>
        <Space align="start" wrap style={{ width: '100%' }}>
          <Form.Item name="supplierId" label="Proveedor" rules={[{ required: true }]} style={{ width: 360 }}>
            <Select showSearch optionFilterProp="label" loading={suppliers.isLoading} options={suppliers.data?.suppliers.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` }))} onChange={() => form.setFieldValue('supplierContactId', undefined)} />
          </Form.Item>
          <Form.Item name="supplierContactId" label="Contacto" style={{ width: 360 }}>
            <Select allowClear showSearch optionFilterProp="label" disabled={!supplierId} loading={contacts.isLoading} options={contacts.data?.contacts.map((item) => ({ value: item.id, label: item.fullName }))} />
          </Form.Item>
        </Space>
        <Form.List name="details">
          {(fields) => <Table
            rowKey="key"
            pagination={false}
            dataSource={fields}
            columns={[
              { title: 'Incluir', render: (_, field) => <Form.Item name={[field.name, 'selected']} valuePropName="checked" noStyle><Checkbox /></Form.Item> },
              { title: 'Producto', render: (_, field) => `${request.details[field.name].product.internalCode} · ${request.details[field.name].product.name}` },
              { title: 'Solicitada', render: (_, field) => request.details[field.name].quantity },
              { title: 'Cantidad a cotizar', render: (_, field) => <Form.Item name={[field.name, 'quantity']} rules={[{ required: true }]} noStyle><InputNumber min={0.0001} max={Number(request.details[field.name].quantity)} precision={4} /></Form.Item> },
              { title: 'Notas', render: (_, field) => <Form.Item name={[field.name, 'notes']} noStyle><Input /></Form.Item> },
            ]}
          />}
        </Form.List>
        <Form.Item name="notes" label="Indicaciones generales" style={{ marginTop: 16 }}>
          <Input.TextArea rows={3} maxLength={5000} showCount />
        </Form.Item>
        <Space>
          <Button onClick={() => setEditor(null)}>Cancelar</Button>
          <Button type="primary" htmlType="submit" loading={save.isPending}>Guardar segmento</Button>
        </Space>
      </Form>
    </Modal>
  </Card>;
}
