import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { Can } from '@/components/authorization/Can.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { permissions } from '@/config/permissions.js';
import { listPurchaseRequests } from '@/modules/purchase-requests/purchase-requests.api.js';
import * as api from '../purchase-quotations.api.js';

const statusLabels = {
  RECEIVED: 'Recibida',
  UNDER_REVIEW: 'En evaluación',
  SELECTED: 'Seleccionada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Vencida',
};
const money = (value, currency) =>
  `${Number(value ?? 0).toLocaleString('es-SV', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;

export function PurchaseQuotationComparisonPage() {
  const { message, modal } = App.useApp();
  const client = useQueryClient();
  const [purchaseRequestId, setPurchaseRequestId] = useState();
  const [allocations, setAllocations] = useState({});
  const requests = useQuery({
    queryKey: ['purchase-requests', 'comparison-options'],
    queryFn: () =>
      listPurchaseRequests({
        page: 1,
        pageSize: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        status: 'IN_QUOTATION',
      }),
  });
  const comparison = useQuery({
    queryKey: ['purchase-quotations', 'comparison', purchaseRequestId],
    queryFn: () => api.getPurchaseQuotationComparison(purchaseRequestId),
    enabled: Boolean(purchaseRequestId),
  });
  const selectAwards = useMutation({
    mutationFn: (data) =>
      api.selectPurchaseQuotationAwards(purchaseRequestId, data),
  });
  const quotations = useMemo(
    () => comparison.data?.links ?? [],
    [comparison.data],
  );
  const baseCurrency =
    comparison.data?.request.company.defaultCurrencyCode ?? 'USD';
  const matrixColumns = [
    {
      title: 'Producto solicitado',
      fixed: 'left',
      width: 260,
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>
            {row.product.internalCode} · {row.product.name}
          </Typography.Text>
          <Typography.Text type="secondary">
            Solicitado: {row.quantity} {row.productUnit.measurementUnit.symbol}
          </Typography.Text>
        </Space>
      ),
    },
    ...quotations.map((link) => ({
      title: `${link.purchaseQuotation.supplier.code} · ${link.purchaseQuotation.supplier.name}`,
      width: 290,
      render: (_, requestDetail) => {
        const offer = link.details.find(
          (item) => item.purchaseRequestDetailId === requestDetail.id,
        );
        if (!offer) return <Typography.Text type="secondary">No cotizado</Typography.Text>;
        const quotation = link.purchaseQuotation;
        const editable = ['UNDER_REVIEW', 'SELECTED', 'REJECTED'].includes(
          quotation.status,
        );
        return (
          <Space direction="vertical" size={4}>
            <Typography.Text>
              Precio normalizado: {money(offer.normalizedUnitPrice, baseCurrency)}
            </Typography.Text>
            <Typography.Text>
              Cotizado: {offer.quantity} · Disponible:{' '}
              {offer.quotationDetail.availableQuantity ?? offer.quantity}
            </Typography.Text>
            <Typography.Text>
              Entrega:{' '}
              {offer.quotationDetail.deliveryDays ?? quotation.deliveryDays ?? '—'} días
            </Typography.Text>
            <Can permission={permissions.purchaseQuotations.select}>
              <InputNumber
                min={0}
                max={Math.min(
                  Number(offer.quantity),
                  Number(
                    offer.quotationDetail.availableQuantity ?? offer.quantity,
                  ),
                )}
                precision={4}
                disabled={!editable}
                placeholder="Adjudicar"
                value={
                  allocations[offer.id] ?? Number(offer.awardedQuantity ?? 0)
                }
                onChange={(value) =>
                  setAllocations((current) => ({
                    ...current,
                    [offer.id]: Number(value ?? 0),
                  }))
                }
              />
            </Can>
          </Space>
        );
      },
    })),
  ];

  async function saveDecision() {
    const awards = quotations
      .flatMap((link) => link.details)
      .map((offer) => ({
        purchaseQuotationRequestDetailId: offer.id,
        awardedQuantity: Number(
          allocations[offer.id] ?? offer.awardedQuantity ?? 0,
        ),
      }))
      .filter((award) => award.awardedQuantity > 0);
    if (!awards.length) {
      message.warning('Adjudica al menos una cantidad antes de continuar.');
      return;
    }
    let reason = '';
    modal.confirm({
      title: 'Confirmar adjudicación',
      content: (
        <Input.TextArea
          rows={4}
          maxLength={5000}
          placeholder="Justificación obligatoria de la decisión"
          onChange={(event) => {
            reason = event.target.value;
          }}
        />
      ),
      okText: 'Confirmar selección',
      onOk: async () => {
        if (!reason.trim()) {
          message.warning('Ingresa la justificación de la decisión.');
          throw new Error('required');
        }
        await selectAwards.mutateAsync({
          expectedUpdatedAt: comparison.data.request.updatedAt,
          reason: reason.trim(),
          awards,
        });
        await Promise.all([
          comparison.refetch(),
          client.invalidateQueries({ queryKey: ['purchase-quotations'] }),
        ]);
        message.success('Adjudicación registrada correctamente.');
      },
    });
  }

  return (
    <>
      <PageHeader
        title="Comparación de cotizaciones"
        description="Compara condiciones y adjudica cantidades por proveedor sin asumir automáticamente la oferta más barata."
      />
      <Card>
        <Select
          showSearch
          allowClear
          optionFilterProp="label"
          placeholder="Selecciona una solicitud en cotización"
          style={{ width: '100%', maxWidth: 600 }}
          loading={requests.isLoading}
          value={purchaseRequestId}
          onChange={(value) => {
            setPurchaseRequestId(value);
            setAllocations({});
          }}
          options={requests.data?.purchaseRequests.map((request) => ({
            value: request.id,
            label: `${request.code} · ${request.branch.name} · requerida ${dayjs(request.requiredDate).format('DD/MM/YYYY')}`,
          }))}
        />
      </Card>
      {comparison.error ? (
        <Alert type="error" showIcon message={comparison.error.message} />
      ) : null}
      {comparison.data ? (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title={`Solicitud ${comparison.data.request.code}`}>
            <Descriptions
              column={3}
              items={[
                {
                  key: 'destination',
                  label: 'Destino',
                  children: `${comparison.data.request.branch.name} · ${comparison.data.request.warehouse.name}`,
                },
                {
                  key: 'required',
                  label: 'Fecha requerida',
                  children: dayjs(comparison.data.request.requiredDate).format(
                    'DD/MM/YYYY',
                  ),
                },
                {
                  key: 'currency',
                  label: 'Moneda comparativa',
                  children: baseCurrency,
                },
              ]}
            />
          </Card>
          {!quotations.length ? (
            <Alert
              type="warning"
              showIcon
              message="La solicitud todavía no tiene cotizaciones vinculadas."
            />
          ) : (
            <>
              <Card title="Comparación por producto">
                <Table
                  rowKey="id"
                  pagination={false}
                  loading={comparison.isLoading}
                  dataSource={comparison.data.request.details}
                  columns={matrixColumns}
                  scroll={{ x: 260 + quotations.length * 290 }}
                />
              </Card>
              <Card title="Condiciones generales">
                <Table
                  rowKey="id"
                  pagination={false}
                  dataSource={quotations.map((link) => link.purchaseQuotation)}
                  columns={[
                    { title: 'Cotización', dataIndex: 'code' },
                    { title: 'Proveedor', render: (_, x) => x.supplier.name },
                    {
                      title: 'Estado',
                      render: (_, x) => (
                        <Tag>{statusLabels[x.status] ?? x.status}</Tag>
                      ),
                    },
                    {
                      title: 'Vigencia',
                      render: (_, x) => dayjs(x.validUntil).format('DD/MM/YYYY'),
                    },
                    {
                      title: 'Entrega',
                      render: (_, x) =>
                        x.deliveryDays == null ? '—' : `${x.deliveryDays} días`,
                    },
                    { title: 'Condiciones', dataIndex: 'paymentTerms' },
                    {
                      title: 'Total normalizado',
                      render: (_, x) =>
                        money(x.normalizedGrandTotal, baseCurrency),
                    },
                  ]}
                />
              </Card>
              <Can permission={permissions.purchaseQuotations.select}>
                <Button
                  type="primary"
                  size="large"
                  loading={selectAwards.isPending}
                  onClick={saveDecision}
                >
                  Confirmar adjudicación
                </Button>
              </Can>
            </>
          )}
        </Space>
      ) : null}
    </>
  );
}
