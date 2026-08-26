import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Typography,
} from 'antd';
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

export function LocationBulkForm({ isSubmitting, onCancel, onSubmit }) {
  const [form] = Form.useForm();
  const branchId = Form.useWatch('branchId', form);
  const levelCount = Form.useWatch('levelCount', form) ?? 0;
  const positionsPerLevel = Form.useWatch('positionsPerLevel', form) ?? 0;
  const capacity = Form.useWatch('capacity', form);
  const capacityUnit = Form.useWatch('capacityUnit', form);
  const aisle = Form.useWatch('aisle', form)?.trim().toUpperCase();
  const rack = Form.useWatch('rack', form)?.trim().toUpperCase();
  const total = levelCount * positionsPerLevel;
  const branches = useQuery({
    queryKey: ['branches', 'location-bulk-options'],
    queryFn: () => branchesApi.listBranches(options),
    staleTime: 300_000,
  });
  const warehouses = useQuery({
    queryKey: ['warehouses', 'location-bulk-options', branchId],
    queryFn: () => warehousesApi.listWarehouses({ ...options, branchId }),
    enabled: Boolean(branchId),
    staleTime: 300_000,
  });

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ levelCount: 1, positionsPerLevel: 1 }}
      onFinish={(values) => {
        const payload = { ...values };
        delete payload.branchId;
        onSubmit({
          ...payload,
          capacity: payload.capacity ?? null,
          capacityUnit: payload.capacityUnit ?? null,
          notes: nullable(payload.notes),
        });
      }}
    >
      <Alert
        showIcon
        type={total > 200 ? 'error' : 'info'}
        message={
          total > 0
            ? `Se crearán ${total} ubicaciones${aisle && rack ? ` en ${aisle} / ${rack}` : ''}.`
            : 'Indica la cantidad de niveles y posiciones.'
        }
        description={
          total > 0 && total <= 200
            ? `Desde nivel 1, posición 1 hasta nivel ${levelCount}, posición ${positionsPerLevel}. Máximo 200 por operación.`
            : 'El lote no puede superar 200 ubicaciones.'
        }
        style={{ marginBottom: 16 }}
      />
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
                label: item.name,
                disabled: item.status !== 'ACTIVE',
              }))}
              onChange={() => form.setFieldValue('warehouseId', undefined)}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="warehouseId"
            label="Almacén"
            rules={[{ required: true }]}
          >
            <Select
              disabled={!branchId}
              showSearch
              optionFilterProp="label"
              loading={warehouses.isLoading}
              options={warehouses.data?.warehouses.map((item) => ({
                value: item.id,
                label: `${item.code} — ${item.name}`,
                disabled: !item.isActive,
              }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="aisle"
            label="Pasillo"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input maxLength={50} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="rack"
            label="Estante"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input maxLength={50} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="levelCount"
            label="Cantidad de niveles"
            rules={[{ required: true }, { type: 'number', min: 1, max: 50 }]}
          >
            <InputNumber
              min={1}
              max={50}
              precision={0}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="positionsPerLevel"
            label="Posiciones por nivel"
            rules={[
              { required: true },
              { type: 'number', min: 1, max: 100 },
              {
                validator: () =>
                  total <= 200
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error('El lote no puede superar 200 ubicaciones.'),
                      ),
              },
            ]}
          >
            <InputNumber
              min={1}
              max={100}
              precision={0}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="capacity"
            label="Capacidad de cada ubicación"
            rules={[
              {
                type: 'number',
                min: 0.0001,
                message: 'Debe ser mayor que cero.',
              },
              {
                required: Boolean(capacityUnit),
                message: 'Indica la capacidad.',
              },
            ]}
          >
            <InputNumber min={0.0001} precision={4} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="capacityUnit"
            label="Unidad de capacidad"
            rules={[
              { required: capacity != null, message: 'Selecciona la unidad.' },
            ]}
          >
            <Select allowClear options={capacityUnits} />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="notes" label="Observaciones compartidas">
            <Input.TextArea rows={3} maxLength={5000} showCount />
          </Form.Item>
        </Col>
      </Row>
      <Typography.Paragraph type="secondary">
        Los códigos internos se generarán automáticamente y cada ubicación podrá
        editarse individualmente después.
      </Typography.Paragraph>
      <Space>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button
          type="primary"
          htmlType="submit"
          loading={isSubmitting}
          disabled={total < 1 || total > 200}
        >
          Crear {total || 0} ubicaciones
        </Button>
      </Space>
    </Form>
  );
}
