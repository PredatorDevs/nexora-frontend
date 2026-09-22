import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
} from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import * as branchesApi from '@/modules/branches/branches.api.js';
import * as warehousesApi from '@/modules/warehouses/warehouses.api.js';
import * as productsApi from '@/modules/products/products.api.js';

const params = { page: 1, pageSize: 100, sortBy: 'name', sortOrder: 'asc' };
const nullable = (value) => value?.trim() || null;

export function PurchaseRequestForm({
  initialValues,
  isSubmitting,
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();
  const [branchId, setBranchId] = useState(initialValues?.branchId);
  const branches = useQuery({
    queryKey: ['branches', 'purchase-request-options'],
    queryFn: () => branchesApi.listBranches({ ...params, status: 'ACTIVE' }),
  });
  const warehouses = useQuery({
    queryKey: ['warehouses', 'purchase-request-options', branchId],
    queryFn: () =>
      warehousesApi.listWarehouses({ ...params, branchId, isActive: true }),
    enabled: Boolean(branchId),
  });
  const products = useQuery({
    queryKey: ['products', 'purchase-request-options'],
    queryFn: () => productsApi.listProducts({ ...params, isActive: true }),
  });
  const productMap = useMemo(
    () => new Map(products.data?.products.map((item) => [item.id, item]) ?? []),
    [products.data],
  );
  const initial = initialValues
    ? {
        branchId: initialValues.branchId,
        warehouseId: initialValues.warehouseId,
        requiredDate: dayjs(initialValues.requiredDate),
        justification: initialValues.justification,
        notes: initialValues.notes,
        details: initialValues.details.map((item) => ({
          productId: item.productId,
          productUnitId: item.productUnitId,
          quantity: Number(item.quantity),
          description: item.description,
          notes: item.notes,
        })),
      }
    : { details: [{ quantity: 1 }], requiredDate: dayjs().add(1, 'day') };
  const error = branches.error || warehouses.error || products.error;
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initial}
      onFinish={(values) =>
        onSubmit({
          ...values,
          requiredDate: values.requiredDate.startOf('day').toISOString(),
          notes: nullable(values.notes),
          details: values.details.map((item) => ({
            ...item,
            description: nullable(item.description),
            notes: nullable(item.notes),
          })),
        })
      }
    >
      {error ? (
        <Alert
          showIcon
          type="error"
          message="No fue posible cargar los catálogos auxiliares."
          description={error.message}
        />
      ) : null}
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="branchId"
            label="Sucursal"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              loading={branches.isLoading}
              options={branches.data?.branches.map((item) => ({
                value: item.id,
                label: `${item.code} · ${item.name}`,
              }))}
              onChange={(value) => {
                setBranchId(value);
                form.setFieldValue('warehouseId', undefined);
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="warehouseId"
            label="Almacén destino"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              disabled={!branchId}
              loading={warehouses.isLoading}
              options={warehouses.data?.warehouses.map((item) => ({
                value: item.id,
                label: `${item.code} · ${item.name}`,
              }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name="requiredDate"
            label="Fecha requerida"
            rules={[{ required: true }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              disabledDate={(date) => date?.endOf('day').isBefore(dayjs())}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={16}>
          <Form.Item
            name="justification"
            label="Justificación"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input maxLength={5000} />
          </Form.Item>
        </Col>
      </Row>
      <Form.List
        name="details"
        rules={[
          {
            validator: async (_, rows) => {
              if (!rows?.length)
                throw new Error('Agrega al menos un producto.');
            },
          },
        ]}
      >
        {(fields, { add, remove }, { errors }) => (
          <>
            {fields.map(({ key, name, ...rest }) => (
              <Row gutter={12} key={key} align="top">
                <Col xs={24} md={8}>
                  <Form.Item
                    {...rest}
                    name={[name, 'productId']}
                    label={name === 0 ? 'Producto' : undefined}
                    rules={[{ required: true }]}
                  >
                    <Select
                      showSearch
                      optionFilterProp="label"
                      loading={products.isLoading}
                      options={products.data?.products.map((item) => ({
                        value: item.id,
                        label: `${item.internalCode} · ${item.name}`,
                      }))}
                      onChange={(productId) =>
                        form.setFieldValue(
                          ['details', name, 'productUnitId'],
                          productMap.get(productId)?.purchaseUnitId,
                        )
                      }
                    />
                  </Form.Item>
                </Col>
                <Col xs={18} md={4}>
                  <Form.Item
                    {...rest}
                    name={[name, 'quantity']}
                    label={name === 0 ? 'Cantidad' : undefined}
                    rules={[{ required: true }]}
                  >
                    <InputNumber
                      min={0.0001}
                      precision={4}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={5}>
                  <Form.Item
                    {...rest}
                    name={[name, 'description']}
                    label={name === 0 ? 'Descripción' : undefined}
                  >
                    <Input maxLength={500} />
                  </Form.Item>
                </Col>
                <Col xs={20} md={5}>
                  <Form.Item
                    {...rest}
                    name={[name, 'notes']}
                    label={name === 0 ? 'Notas de línea' : undefined}
                  >
                    <Input maxLength={5000} />
                  </Form.Item>
                </Col>
                <Col xs={4} md={2} style={{ paddingTop: name === 0 ? 30 : 0 }}>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    aria-label="Quitar producto"
                    onClick={() => remove(name)}
                  />
                </Col>
                <Form.Item {...rest} name={[name, 'productUnitId']} hidden>
                  <InputNumber />
                </Form.Item>
              </Row>
            ))}
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => add({ quantity: 1 })}
            >
              Agregar producto
            </Button>
            <Form.ErrorList errors={errors} />
          </>
        )}
      </Form.List>
      <Form.Item name="notes" label="Notas generales" style={{ marginTop: 16 }}>
        <Input.TextArea rows={3} maxLength={5000} showCount />
      </Form.Item>
      <Space>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button type="primary" htmlType="submit" loading={isSubmitting}>
          Guardar borrador
        </Button>
      </Space>
    </Form>
  );
}
