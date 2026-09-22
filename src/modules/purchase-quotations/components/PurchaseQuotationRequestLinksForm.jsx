import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Form, InputNumber, Select, Space } from 'antd';

const flattenLinks = (quotation) =>
  quotation.requestLinks?.flatMap((link) =>
    link.details.map((detail) => ({
      purchaseQuotationDetailId: detail.purchaseQuotationDetailId,
      purchaseRequestDetailId: detail.purchaseRequestDetailId,
      quantity: Number(detail.quantity),
    })),
  ) ?? [];

export function PurchaseQuotationRequestLinksForm({
  quotation,
  purchaseRequests,
  isSubmitting,
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();
  const requestDetails = purchaseRequests.flatMap((request) =>
    request.details.map((detail) => ({ ...detail, request })),
  );
  const quotationOptions = quotation.details.map((detail) => ({
    value: detail.id,
    label: `#${detail.lineNumber} · ${detail.product.internalCode} · ${detail.product.name} (${detail.quantity})`,
  }));

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ links: flattenLinks(quotation) }}
      onFinish={({ links }) => onSubmit(links)}
    >
      <Alert
        type="info"
        showIcon
        message="Asigna el origen de cada renglón cotizado"
        description="Cada línea debe cubrir exactamente su cantidad cotizada. Puedes distribuirla entre varias solicitudes aprobadas."
        style={{ marginBottom: 16 }}
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
                  rules={[{ required: true, message: 'Selecciona la línea.' }]}
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
                        label: `${item.request.code} · línea ${item.lineNumber} · disponible ${item.quantity}`,
                      }));
                    return (
                      <Form.Item
                        name={[field.name, 'purchaseRequestDetailId']}
                        label="Línea de solicitud"
                        rules={[
                          { required: true, message: 'Selecciona la solicitud.' },
                        ]}
                      >
                        <Select
                          showSearch
                          optionFilterProp="label"
                          disabled={!quotationDetail}
                          placeholder={
                            quotationDetail
                              ? 'Solicitud aprobada'
                              : 'Selecciona primero la línea cotizada'
                          }
                          style={{ width: 350 }}
                          options={options}
                        />
                      </Form.Item>
                    );
                  }}
                </Form.Item>
                <Form.Item
                  name={[field.name, 'quantity']}
                  label="Cantidad vinculada"
                  rules={[{ required: true, message: 'Indica la cantidad.' }]}
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
              Agregar asignación
            </Button>
          </Space>
        )}
      </Form.List>
      <Space style={{ marginTop: 24 }}>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button type="primary" htmlType="submit" loading={isSubmitting}>
          Guardar vínculos
        </Button>
      </Space>
    </Form>
  );
}
