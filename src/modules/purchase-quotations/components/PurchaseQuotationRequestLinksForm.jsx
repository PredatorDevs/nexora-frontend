import {
  CheckCircleOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Alert, Button, Form, InputNumber, Select, Space, Table, Tag } from 'antd';

const EPSILON = 0.000001;

const existingLinks = (quotation) =>
  quotation.requestLinks?.flatMap((link) =>
    link.details.map((detail) => ({
      purchaseQuotationDetailId: detail.purchaseQuotationDetailId,
      purchaseRequestDetailId: detail.purchaseRequestDetailId,
      quantity: Number(detail.quantity),
    })),
  ) ?? [];

const initialLinks = (quotation) => {
  const links = existingLinks(quotation);
  const linkedDetailIds = new Set(
    links.map((link) => link.purchaseQuotationDetailId),
  );

  return [
    ...links,
    ...quotation.details
      .filter((detail) => !linkedDetailIds.has(detail.id))
      .map((detail) => ({
        purchaseQuotationDetailId: detail.id,
        quantity: Number(detail.quantity),
      })),
  ];
};

const calculateSummary = (quotation, links = []) =>
  quotation.details.map((detail) => {
    const quoted = Number(detail.quantity);
    const assigned = links
      .filter((link) => link?.purchaseQuotationDetailId === detail.id)
      .reduce((total, link) => total + Number(link?.quantity || 0), 0);
    const pending = quoted - assigned;
    const complete =
      Math.abs(pending) < EPSILON &&
      links.some(
        (link) =>
          link?.purchaseQuotationDetailId === detail.id &&
          link?.purchaseRequestDetailId &&
          Number(link?.quantity) > 0,
      );

    return { ...detail, quoted, assigned, pending, complete };
  });

const formatQuantity = (value) =>
  Number(value).toLocaleString('es-SV', { maximumFractionDigits: 4 });

export function PurchaseQuotationRequestLinksForm({
  quotation,
  purchaseRequests,
  isSubmitting,
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();
  const links = Form.useWatch('links', form) ?? [];
  const summary = calculateSummary(quotation, links);
  const isComplete = summary.every((detail) => detail.complete);
  const requestDetails = purchaseRequests.flatMap((request) =>
    request.details.map((detail) => ({ ...detail, request })),
  );
  const quotationOptions = quotation.details.map((detail) => ({
    value: detail.id,
    label: `#${detail.lineNumber} · ${detail.product.internalCode} · ${detail.product.name} (${formatQuantity(detail.quantity)})`,
  }));

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ links: initialLinks(quotation) }}
      onFinish={({ links: submittedLinks }) => onSubmit(submittedLinks)}
    >
      <Alert
        type="info"
        showIcon
        message="Vincula todas las líneas de la cotización"
        description="Cada línea debe quedar asignada exactamente por su cantidad cotizada. Si procede de varias solicitudes, distribuye la cantidad mediante varias asignaciones."
        style={{ marginBottom: 16 }}
      />

      <Table
        rowKey="id"
        size="small"
        pagination={false}
        dataSource={summary}
        style={{ marginBottom: 20 }}
        columns={[
          {
            title: 'Línea cotizada',
            render: (_, detail) =>
              `#${detail.lineNumber} · ${detail.product.internalCode} · ${detail.product.name}`,
          },
          { title: 'Cotizada', dataIndex: 'quoted', render: formatQuantity },
          { title: 'Asignada', dataIndex: 'assigned', render: formatQuantity },
          {
            title: 'Pendiente',
            dataIndex: 'pending',
            render: (value) => formatQuantity(Math.max(0, value)),
          },
          {
            title: 'Estado',
            render: (_, detail) =>
              detail.complete ? (
                <Tag color="success" icon={<CheckCircleOutlined />}>
                  Completa
                </Tag>
              ) : detail.pending < -EPSILON ? (
                <Tag color="error" icon={<WarningOutlined />}>
                  Excede por {formatQuantity(Math.abs(detail.pending))}
                </Tag>
              ) : (
                <Tag color="warning" icon={<WarningOutlined />}>
                  Faltan {formatQuantity(detail.pending)}
                </Tag>
              ),
          },
        ]}
      />

      <Form.List name="links">
        {(fields, { add, remove }) => (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {fields.map((field) => (
              <Space key={field.key} align="start" wrap>
                <Form.Item
                  {...field}
                  name={[field.name, 'purchaseQuotationDetailId']}
                  label="Línea de cotización"
                  rules={[{ required: true, message: 'Selecciona la línea cotizada.' }]}
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    style={{ width: 350 }}
                    options={quotationOptions}
                  />
                </Form.Item>
                <Form.Item noStyle shouldUpdate>
                  {({ getFieldValue }) => {
                    const quotationDetailId = getFieldValue([
                      'links',
                      field.name,
                      'purchaseQuotationDetailId',
                    ]);
                    const quotationDetail = quotation.details.find(
                      (item) => item.id === quotationDetailId,
                    );
                    const options = requestDetails
                      .filter(
                        (item) =>
                          quotationDetail &&
                          item.productId === quotationDetail.productId &&
                          item.productUnitId === quotationDetail.productUnitId,
                      )
                      .map((item) => ({
                        value: item.id,
                        label: `${item.request.code} · línea ${item.lineNumber} · solicitada ${formatQuantity(item.quantity)}`,
                      }));
                    return (
                      <Form.Item
                        name={[field.name, 'purchaseRequestDetailId']}
                        label="Línea de solicitud"
                        rules={[
                          { required: true, message: 'Selecciona la línea solicitada.' },
                        ]}
                      >
                        <Select
                          showSearch
                          optionFilterProp="label"
                          disabled={!quotationDetail}
                          placeholder={
                            quotationDetail
                              ? options.length
                                ? 'Selecciona una solicitud compatible'
                                : 'No hay solicitudes compatibles'
                              : 'Selecciona primero la línea cotizada'
                          }
                          style={{ width: 350 }}
                          options={options}
                          status={quotationDetail && !options.length ? 'error' : undefined}
                        />
                      </Form.Item>
                    );
                  }}
                </Form.Item>
                <Form.Item
                  name={[field.name, 'quantity']}
                  label="Cantidad vinculada"
                  rules={[{ required: true, message: 'Indica la cantidad vinculada.' }]}
                >
                  <InputNumber min={0.0001} precision={4} style={{ width: 180 }} />
                </Form.Item>
                <Button
                  danger
                  type="text"
                  aria-label="Quitar vínculo"
                  icon={<MinusCircleOutlined />}
                  onClick={() => remove(field.name)}
                  style={{ marginTop: 30 }}
                />
              </Space>
            ))}
            <Button icon={<PlusOutlined />} onClick={() => add()}>
              Agregar otra asignación
            </Button>
          </Space>
        )}
      </Form.List>

      {!isComplete ? (
        <Alert
          type="warning"
          showIcon
          message="Completa la asignación de todas las líneas para continuar."
          style={{ marginTop: 20 }}
        />
      ) : null}

      <Space style={{ marginTop: 24 }}>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button
          type="primary"
          htmlType="submit"
          loading={isSubmitting}
          disabled={!isComplete}
        >
          Guardar vínculos
        </Button>
      </Space>
    </Form>
  );
}
