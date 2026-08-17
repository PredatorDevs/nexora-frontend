import { useQuery } from '@tanstack/react-query';
import { Button, Col, Form, Input, InputNumber, Row, Select, Space } from 'antd';
import * as branchesApi from '@/modules/branches/branches.api.js';
import * as warehousesApi from '@/modules/warehouses/warehouses.api.js';

const options = { page: 1, pageSize: 100, sortBy: 'name', sortOrder: 'asc' };
const nullable = (value) => value?.trim() || null;
const capacityUnits = [
  { value: 'UNITS', label: 'Unidades' },
  { value: 'KG', label: 'Kilogramos' },
  { value: 'M3', label: 'Metros cúbicos' },
  { value: 'PALLETS', label: 'Tarimas' },
];

export function LocationForm({ initialValues, isSubmitting, onCancel, onSubmit }) {
  const [form] = Form.useForm();
  const branchId = Form.useWatch('branchId', form);
  const capacity = Form.useWatch('capacity', form);
  const capacityUnit = Form.useWatch('capacityUnit', form);
  const editing = Boolean(initialValues);
  const branches = useQuery({
    queryKey: ['branches', 'location-options'],
    queryFn: () => branchesApi.listBranches(options),
    staleTime: 300_000,
  });
  const warehouses = useQuery({
    queryKey: ['warehouses', 'location-options', branchId],
    queryFn: () => warehousesApi.listWarehouses({ ...options, branchId }),
    enabled: Boolean(branchId),
    staleTime: 300_000,
  });
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        ...initialValues,
        branchId: initialValues?.warehouse?.branchId,
        capacity: initialValues?.capacity == null ? null : Number(initialValues.capacity),
      }}
      onFinish={(values) => {
        const payload = { ...values };
        delete payload.branchId;
        if (editing) delete payload.warehouseId;
        onSubmit({
          ...payload,
          capacity: payload.capacity ?? null,
          capacityUnit: payload.capacityUnit ?? null,
          notes: nullable(payload.notes),
        });
      }}
    >
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item name="branchId" label="Sucursal" rules={[{ required: true }]}>
            <Select
              disabled={editing}
              showSearch
              optionFilterProp="label"
              loading={branches.isLoading}
              options={branches.data?.branches.map((item) => ({
                value: item.id, label: item.name, disabled: item.status !== 'ACTIVE',
              }))}
              onChange={() => form.setFieldValue('warehouseId', undefined)}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="warehouseId" label="Almacén" rules={[{ required: true }]}>
            <Select
              disabled={editing || !branchId}
              showSearch
              optionFilterProp="label"
              loading={warehouses.isLoading}
              options={warehouses.data?.warehouses.map((item) => ({
                value: item.id, label: `${item.code} — ${item.name}`, disabled: !item.isActive,
              }))}
            />
          </Form.Item>
        </Col>
        {['aisle', 'rack', 'level', 'position'].map((name) => (
          <Col xs={24} md={6} key={name}>
            <Form.Item
              name={name}
              label={{ aisle: 'Pasillo', rack: 'Estante', level: 'Nivel', position: 'Posición' }[name]}
              rules={[{ required: true }]}
            >
              <Input maxLength={50} />
            </Form.Item>
          </Col>
        ))}
        <Col xs={24} md={12}>
          <Form.Item
            name="capacity"
            label="Capacidad"
            rules={[
              { type: 'number', min: 0.0001, message: 'Debe ser mayor que cero.' },
              { required: Boolean(capacityUnit), message: 'Indica la capacidad.' },
            ]}
          >
            <InputNumber min={0.0001} precision={4} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="capacityUnit"
            label="Unidad de capacidad"
            rules={[{ required: capacity != null, message: 'Selecciona la unidad.' }]}
          >
            <Select allowClear options={capacityUnits} />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="notes" label="Observaciones">
            <Input.TextArea rows={3} maxLength={5000} showCount />
          </Form.Item>
        </Col>
      </Row>
      <Space>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button type="primary" htmlType="submit" loading={isSubmitting}>Guardar ubicación</Button>
      </Space>
    </Form>
  );
}
