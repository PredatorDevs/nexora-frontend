import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Radio,
  Select,
  Space,
  Statistic,
} from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useAuth } from '@/auth/useAuth.js';
import * as suppliersApi from '@/modules/suppliers/suppliers.api.js';
import * as productsApi from '@/modules/products/products.api.js';
import * as quotationsApi from '../purchase-quotations.api.js';
const params = {
  page: 1,
  pageSize: 100,
  sortBy: 'name',
  sortOrder: 'asc',
  isActive: true,
};
const contactParams = { ...params, sortBy: 'fullName' };
const nullable = (v) => v?.trim() || null;
export function PurchaseQuotationForm({
  initialValues,
  isSubmitting,
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();
  const { activeMembership } = useAuth();
  const defaultCurrency =
    activeMembership?.company?.defaultCurrencyCode ?? 'USD';
  const [supplierId, setSupplierId] = useState(initialValues?.supplierId);
  const [sourceRequestId, setSourceRequestId] = useState(null);
  const [sourceMode, setSourceMode] = useState('FULL_REQUEST');
  const [segmentId, setSegmentId] = useState(null);
  const [loadedSource, setLoadedSource] = useState(null);
  const suppliers = useQuery({
    queryKey: ['suppliers', 'quotation-options'],
    queryFn: () => suppliersApi.listSuppliers(params),
  });
  const contacts = useQuery({
    queryKey: ['supplier-contacts', 'quotation-options', supplierId],
    queryFn: () => suppliersApi.listSupplierContacts(supplierId, contactParams),
    enabled: Boolean(supplierId),
  });
  const products = useQuery({
    queryKey: ['products', 'quotation-options'],
    queryFn: () => productsApi.listProducts(params),
  });
  const sources = useQuery({
    queryKey: ['purchase-quotations', 'sources', supplierId],
    queryFn: () => quotationsApi.listPurchaseQuotationSources(supplierId),
    enabled: !initialValues && Boolean(supplierId),
  });
  const selectedRequest = sources.data?.find((item) => item.id === sourceRequestId);
  const availableSegments = selectedRequest?.supplierSegments ?? [];
  const productMap = useMemo(
    () => new Map(products.data?.products.map((x) => [x.id, x]) ?? []),
    [products.data],
  );
  const rows = Form.useWatch('details', form) ?? [];
  const currency = Form.useWatch('currencyCode', form) ?? defaultCurrency;
  const total = rows.reduce((sum, row) => {
    const gross = Number(row?.quantity || 0) * Number(row?.unitPrice || 0);
    const net = gross * (1 - Number(row?.discountRate || 0) / 100);
    return sum + net * (1 + Number(row?.taxRate || 0) / 100);
  }, 0);
  const initial = initialValues
    ? {
        ...initialValues,
        quotationDate: dayjs(initialValues.quotationDate),
        validUntil: dayjs(initialValues.validUntil),
        exchangeRateDate: initialValues.exchangeRateDate
          ? dayjs(initialValues.exchangeRateDate)
          : null,
        details: initialValues.details.map((x) => ({
          ...x,
          quantity: Number(x.quantity),
          unitPrice: Number(x.unitPrice),
          discountRate: Number(x.discountRate),
          taxRate: Number(x.taxRate),
          availableQuantity:
            x.availableQuantity == null ? null : Number(x.availableQuantity),
        })),
      }
    : {
        quotationDate: dayjs(),
        validUntil: dayjs().add(15, 'day'),
        currencyCode: defaultCurrency,
        exchangeRate: 1,
        details: [{ quantity: 1, unitPrice: 0, discountRate: 0, taxRate: 13 }],
      };
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initial}
      onFinish={(v) =>
        onSubmit({
          ...v,
          quotationDate: v.quotationDate.toISOString(),
          validUntil: v.validUntil.toISOString(),
          exchangeRateDate: v.exchangeRateDate?.toISOString() ?? null,
          supplierContactId: v.supplierContactId ?? null,
          supplierQuotationNumber: nullable(v.supplierQuotationNumber),
          paymentTerms: nullable(v.paymentTerms),
          notes: nullable(v.notes),
          ...(!initialValues ? { source: loadedSource } : {}),
          details: v.details.map((x) => ({
            ...x,
            deliveryDays: x.deliveryDays ?? null,
            availableQuantity: x.availableQuantity ?? null,
            notes: nullable(x.notes),
          })),
        })
      }
    >
      {suppliers.error || contacts.error || products.error || sources.error ? (
        <Alert
          type="error"
          showIcon
          message="No fue posible cargar los catálogos auxiliares."
        />
      ) : null}
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="supplierId"
            label="Proveedor"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              loading={suppliers.isLoading}
              options={suppliers.data?.suppliers.map((x) => ({
                value: x.id,
                label: `${x.code} · ${x.name}`,
              }))}
              onChange={(v) => {
                setSupplierId(v);
                form.setFieldValue('supplierContactId', null);
                setSourceRequestId(null);
                setSegmentId(null);
                setLoadedSource(null);
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="supplierContactId" label="Contacto">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              disabled={!supplierId}
              loading={contacts.isLoading}
              options={contacts.data?.contacts.map((x) => ({
                value: x.id,
                label: x.fullName,
              }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name="supplierQuotationNumber"
            label="Número del proveedor"
          >
            <Input maxLength={120} />
          </Form.Item>
        </Col>
        <Col xs={12} md={8}>
          <Form.Item
            name="quotationDate"
            label="Fecha"
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={12} md={8}>
          <Form.Item
            name="validUntil"
            label="Válida hasta"
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item
            name="currencyCode"
            label="Moneda"
            rules={[{ required: true, len: 3 }]}
          >
            <Input maxLength={3} style={{ textTransform: 'uppercase' }} />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item
            name="exchangeRate"
            label="Tipo de cambio"
            rules={[{ required: true }]}
          >
            <InputNumber
              min={0.00000001}
              precision={8}
              disabled={currency === defaultCurrency}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item
            name="exchangeRateDate"
            label="Fecha del cambio"
            rules={currency === defaultCurrency ? [] : [{ required: true }]}
          >
            <DatePicker
              disabled={currency === defaultCurrency}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item name="deliveryDays" label="Entrega general (días)">
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="paymentTerms" label="Condiciones de pago">
            <Input maxLength={500} />
          </Form.Item>
        </Col>
      </Row>
      {!initialValues && supplierId ? (
        <Card size="small" title="Precargar desde una solicitud" style={{ marginBottom: 16 }}>
          <Alert
            type="info"
            showIcon
            message="Opcional"
            description="Puedes cargar una solicitud consolidada completa o un segmento emitido para este proveedor. Al guardar, los vínculos de origen se crearán automáticamente."
            style={{ marginBottom: 16 }}
          />
          <Row gutter={16}>
            <Col xs={24} md={10}>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Seleccionar solicitud consolidada"
                loading={sources.isLoading}
                value={sourceRequestId}
                options={sources.data?.map((item) => ({
                  value: item.id,
                  label: `${item.code} · ${item.branch.name} / ${item.warehouse.name}`,
                }))}
                onChange={(value) => {
                  setSourceRequestId(value);
                  setSourceMode('FULL_REQUEST');
                  setSegmentId(null);
                  setLoadedSource(null);
                }}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} md={6}>
              <Radio.Group
                value={sourceMode}
                disabled={!selectedRequest}
                onChange={(event) => {
                  setSourceMode(event.target.value);
                  setSegmentId(null);
                  setLoadedSource(null);
                }}
              >
                <Radio.Button value="FULL_REQUEST">Solicitud completa</Radio.Button>
                <Radio.Button value="SEGMENT" disabled={!availableSegments.length}>
                  Segmento
                </Radio.Button>
              </Radio.Group>
            </Col>
            <Col xs={24} md={5}>
              <Select
                placeholder="Seleccionar segmento"
                disabled={sourceMode !== 'SEGMENT'}
                value={segmentId}
                options={availableSegments.map((item) => ({
                  value: item.id,
                  label: item.code,
                }))}
                onChange={(value) => {
                  setSegmentId(value);
                  setLoadedSource(null);
                }}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} md={3}>
              <Button
                type="primary"
                disabled={
                  !selectedRequest ||
                  (sourceMode === 'SEGMENT' && !segmentId)
                }
                onClick={() => {
                  const segment = sourceMode === 'SEGMENT'
                    ? availableSegments.find((item) => item.id === segmentId)
                    : null;
                  const byId = new Map(selectedRequest.details.map((item) => [item.id, item]));
                  const originDetails = segment
                    ? segment.details.map((item) => ({
                        ...byId.get(item.purchaseRequestDetailId),
                        quantity: item.quantity,
                        notes: item.notes ?? byId.get(item.purchaseRequestDetailId)?.notes,
                      }))
                    : selectedRequest.details;
                  form.setFieldValue(
                    'details',
                    originDetails.map((item) => ({
                      purchaseRequestDetailId: item.id,
                      productId: item.productId,
                      productUnitId: item.productUnitId,
                      quantity: Number(item.quantity),
                      unitPrice: 0,
                      discountRate: 0,
                      taxRate: 13,
                      availableQuantity: null,
                      deliveryDays: null,
                      notes: item.notes ?? null,
                    })),
                  );
                  setLoadedSource({
                    mode: sourceMode,
                    purchaseRequestId: selectedRequest.id,
                    segmentId: segment?.id ?? null,
                  });
                }}
              >
                Cargar
              </Button>
            </Col>
          </Row>
          {loadedSource ? (
            <Alert
              type="success"
              showIcon
              message={`Origen cargado: ${selectedRequest?.code ?? ''}${loadedSource.segmentId ? ` / ${availableSegments.find((item) => item.id === loadedSource.segmentId)?.code ?? ''}` : ''}`}
              style={{ marginTop: 12 }}
            />
          ) : null}
        </Card>
      ) : null}
      <Form.List name="details">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...rest }) => (
              <Row gutter={8} key={key}>
                <Col xs={24} md={6}>
                  <Form.Item
                    {...rest}
                    name={[name, 'productId']}
                    label={name === 0 ? 'Producto' : undefined}
                    rules={[{ required: true }]}
                  >
                    <Select
                      disabled={Boolean(rows[name]?.purchaseRequestDetailId)}
                      showSearch
                      optionFilterProp="label"
                      options={products.data?.products.map((x) => ({
                        value: x.id,
                        label: `${x.internalCode} · ${x.name}`,
                      }))}
                      onChange={(id) =>
                        form.setFieldValue(
                          ['details', name, 'productUnitId'],
                          productMap.get(id)?.purchaseUnitId,
                        )
                      }
                    />
                  </Form.Item>
                </Col>
                <Col xs={12} md={3}>
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
                <Col xs={12} md={3}>
                  <Form.Item
                    {...rest}
                    name={[name, 'unitPrice']}
                    label={name === 0 ? 'Precio' : undefined}
                    rules={[{ required: true }]}
                  >
                    <InputNumber
                      min={0}
                      precision={6}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={8} md={3}>
                  <Form.Item
                    {...rest}
                    name={[name, 'discountRate']}
                    label={name === 0 ? 'Desc. %' : undefined}
                  >
                    <InputNumber min={0} max={100} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={8} md={3}>
                  <Form.Item
                    {...rest}
                    name={[name, 'taxRate']}
                    label={name === 0 ? 'Imp. %' : undefined}
                  >
                    <InputNumber min={0} max={100} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={8} md={3}>
                  <Form.Item
                    {...rest}
                    name={[name, 'availableQuantity']}
                    label={name === 0 ? 'Disponible' : undefined}
                  >
                    <InputNumber
                      min={0}
                      precision={4}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={20} md={2}>
                  <Form.Item
                    {...rest}
                    name={[name, 'deliveryDays']}
                    label={name === 0 ? 'Días' : undefined}
                  >
                    <InputNumber
                      min={0}
                      precision={0}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={4} md={1} style={{ paddingTop: name === 0 ? 30 : 0 }}>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => remove(name)}
                  />
                </Col>
                <Form.Item {...rest} name={[name, 'productUnitId']} hidden>
                  <InputNumber />
                </Form.Item>
                <Form.Item {...rest} name={[name, 'purchaseRequestDetailId']} hidden>
                  <InputNumber />
                </Form.Item>
              </Row>
            ))}
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              disabled={Boolean(loadedSource)}
              onClick={() =>
                add({ quantity: 1, unitPrice: 0, discountRate: 0, taxRate: 13 })
              }
            >
              Agregar producto
            </Button>
          </>
        )}
      </Form.List>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} md={18}>
          <Form.Item name="notes" label="Observaciones">
            <Input.TextArea rows={3} maxLength={5000} />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Statistic
            title="Total estimado"
            value={total}
            precision={2}
            suffix={currency}
          />
        </Col>
      </Row>
      <Space>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button type="primary" htmlType="submit" loading={isSubmitting}>
          Guardar borrador
        </Button>
      </Space>
    </Form>
  );
}
