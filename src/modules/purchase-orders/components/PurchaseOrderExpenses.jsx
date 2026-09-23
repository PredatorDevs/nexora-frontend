import {
  DeleteOutlined,
  EditOutlined,
  FileOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import {
  App,
  Button,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Upload,
} from 'antd';
import { useState } from 'react';
import { Can } from '@/components/authorization/Can.jsx';
import { permissions } from '@/config/permissions.js';
import { listExpenseTypes } from '@/modules/expense-types/expense-types.api.js';
import * as api from '../purchase-orders.api.js';
const editableStatuses = ['DRAFT', 'PENDING_APPROVAL'];
export function PurchaseOrderExpenses({ order, onChange }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const types = useQuery({
    queryKey: ['expense-types', 'active'],
    queryFn: () =>
      listExpenseTypes({
        page: 1,
        pageSize: 100,
        sortBy: 'name',
        sortOrder: 'asc',
        isActive: true,
      }),
  });
  const editable = editableStatuses.includes(order.status);
  const open = (item) => {
    setEditing(item ?? {});
    form.setFieldsValue(
      item
        ? {
            expenseTypeId: item.expenseTypeId,
            description: item.description,
            amount: Number(item.amount),
            isCostable: item.isCostable,
          }
        : { isCostable: true },
    );
  };
  async function save(values) {
    setBusy(true);
    try {
      const updated = editing.id
        ? await api.updatePurchaseOrderExpense(order, editing, values)
        : await api.createPurchaseOrderExpense(order, values);
      message.success('Gasto guardado.');
      setEditing(null);
      form.resetFields();
      onChange(updated);
    } catch (error) {
      message.error(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(item) {
    try {
      const updated = await api.deletePurchaseOrderExpense(order, item);
      message.success('Gasto eliminado.');
      onChange(updated);
    } catch (error) {
      message.error(error.message);
    }
  }
  async function upload(item, file) {
    try {
      await api.uploadPurchaseOrderDocument(order.id, item.id, file);
      message.success('Documento adjuntado.');
      onChange();
    } catch (error) {
      message.error(error.message);
    }
    return false;
  }
  const columns = [
    { title: '#', dataIndex: 'lineNumber', width: 55 },
    { title: 'Tipo', render: (_, x) => x.expenseType.name },
    { title: 'Descripción', dataIndex: 'description' },
    {
      title: 'Monto',
      render: (_, x) =>
        Number(x.amount).toLocaleString('es-SV', { minimumFractionDigits: 2 }),
    },
    { title: 'Costeable', render: (_, x) => (x.isCostable ? 'Sí' : 'No') },
    {
      title: 'Documentos',
      render: (_, x) => (
        <Space wrap>
          {x.documents.map((doc) => (
            <Space key={doc.id}>
              <Button
                type="link"
                icon={<FileOutlined />}
                onClick={() =>
                  api.openPurchaseOrderDocument(order.id, x.id, doc.id)
                }
              >
                {doc.originalFileName}
              </Button>
              {editable ? (
                <Can permission={permissions.purchaseOrders.manageDocuments}>
                  <Popconfirm
                    title="¿Eliminar documento?"
                    onConfirm={async () => {
                      await api.deletePurchaseOrderDocument(
                        order.id,
                        x.id,
                        doc.id,
                      );
                      onChange();
                    }}
                  >
                    <Button danger type="text" icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Can>
              ) : null}
            </Space>
          ))}
          {!['CANCELLED', 'CLOSED'].includes(order.status) ? (
            <Can permission={permissions.purchaseOrders.manageDocuments}>
              <Upload
                accept="application/pdf,image/jpeg,image/png,image/webp"
                maxCount={1}
                showUploadList={false}
                beforeUpload={(file) => upload(x, file)}
              >
                <Button icon={<UploadOutlined />}>Adjuntar</Button>
              </Upload>
            </Can>
          ) : null}
        </Space>
      ),
    },
    {
      title: 'Acciones',
      render: (_, x) =>
        editable ? (
          <Can permission={permissions.purchaseOrders.manageExpenses}>
            <Space>
              <Button icon={<EditOutlined />} onClick={() => open(x)} />
              <Popconfirm
                title="¿Eliminar gasto?"
                disabled={x.documents.length > 0}
                onConfirm={() => remove(x)}
              >
                <Button
                  danger
                  disabled={x.documents.length > 0}
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </Space>
          </Can>
        ) : null,
    },
  ];
  return (
    <>
      <Space
        style={{
          width: '100%',
          justifyContent: 'space-between',
          marginTop: 20,
          marginBottom: 8,
        }}
      >
        <strong>Gastos adicionales</strong>
        {editable ? (
          <Can permission={permissions.purchaseOrders.manageExpenses}>
            <Button icon={<PlusOutlined />} onClick={() => open()}>
              Agregar gasto
            </Button>
          </Can>
        ) : null}
      </Space>
      <Table
        rowKey="id"
        pagination={false}
        dataSource={order.expenses}
        columns={columns}
        scroll={{ x: 900 }}
      />
      <Modal
        title={editing?.id ? 'Editar gasto' : 'Agregar gasto'}
        open={Boolean(editing)}
        footer={null}
        onCancel={() => {
          setEditing(null);
          form.resetFields();
        }}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item
            name="expenseTypeId"
            label="Tipo de gasto"
            rules={[{ required: true }]}
          >
            <Select
              options={types.data?.expenseTypes.map((x) => ({
                value: x.id,
                label: `${x.code} · ${x.name}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="description" label="Descripción">
            <Input maxLength={500} />
          </Form.Item>
          <Form.Item name="amount" label="Monto" rules={[{ required: true }]}>
            <InputNumber
              min={0.000001}
              precision={6}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item name="isCostable" valuePropName="checked">
            <Checkbox>Incluir en el costo real</Checkbox>
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={busy}>
            Guardar gasto
          </Button>
        </Form>
      </Modal>
    </>
  );
}
