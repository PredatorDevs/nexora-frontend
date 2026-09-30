import { Descriptions, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import { statusColors, statusLabels } from '../retaceos.constants.js';

const date = (value, time = true) => value ? dayjs(value).format(time ? 'DD/MM/YYYY HH:mm' : 'DD/MM/YYYY') : '—';
const money = (value, currency) => `${Number(value ?? 0).toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${currency}`;

export function RetaceoDetails({ value }) {
  return <>
    <Descriptions bordered size="small" column={2} items={[
      { key: 'uuid', label: 'UUID', children: value.uuid },
      { key: 'status', label: 'Estado', children: <Tag color={statusColors[value.status]}>{statusLabels[value.status]}</Tag> },
      { key: 'purchase', label: 'Compra', children: value.purchase.code },
      { key: 'supplier', label: 'Proveedor', children: `${value.supplier.code} · ${value.supplier.name}` },
      { key: 'country', label: 'País de origen', children: value.originCountry.name },
      { key: 'date', label: 'Fecha', children: date(value.retaceoDate) },
      { key: 'invoice', label: 'Factura de importación', children: value.importInvoiceNumber || '—' },
      { key: 'invoiceDate', label: 'Fecha de factura', children: date(value.importInvoiceDate, false) },
      { key: 'policy', label: 'Póliza de importación', children: value.importPolicyNumber || '—' },
      { key: 'policyDate', label: 'Fecha de póliza', children: date(value.importPolicyDate, false) },
      { key: 'currency', label: 'Moneda / Cambio', children: `${value.currencyCode} · ${value.exchangeRate}` },
      { key: 'version', label: 'Versión del cálculo', children: value.calculationVersion },
      { key: 'totals', label: 'FOB / CIF / Capitalizable / Recuperable / Costo real', span: 2, children: `${money(value.totalFob, value.currencyCode)} · ${money(value.totalCif, value.currencyCode)} · ${money(value.totalCapitalizableCosts, value.currencyCode)} · ${money(value.totalRecoverableTaxes, value.currencyCode)} · ${money(value.totalLandedCost, value.currencyCode)}` },
      { key: 'notes', label: 'Observaciones', span: 2, children: value.notes || '—' },
      { key: 'created', label: 'Creado por', children: `${value.createdBy.displayName} · ${date(value.createdAt)}` },
      { key: 'calculated', label: 'Calculado por', children: value.calculatedAt ? `${value.calculatedBy?.displayName || '—'} · ${date(value.calculatedAt)}` : '—' },
      { key: 'verified', label: 'Verificado por', children: value.verifiedAt ? `${value.verifiedBy?.displayName || '—'} · ${date(value.verifiedAt)}` : '—' },
      { key: 'closed', label: 'Cerrado por', children: value.closedAt ? `${value.closedBy?.displayName || '—'} · ${date(value.closedAt)}` : '—' },
      { key: 'cancelled', label: 'Cancelado por', children: value.cancelledAt ? `${value.cancelledBy?.displayName || '—'} · ${date(value.cancelledAt)}` : '—' },
      { key: 'reason', label: 'Motivo de cancelación', children: value.cancellationReason || '—' },
    ]} />
    <Table style={{ marginTop: 16 }} rowKey="id" pagination={false} dataSource={value.details} scroll={{ x: 1100 }} columns={[
      { title: '#', dataIndex: 'lineNumber', width: 55 },
      { title: 'Producto', render: (_, item) => `${item.product.internalCode} · ${item.product.name}` },
      { title: 'Unidad', render: (_, item) => item.productUnit.name },
      { title: 'Cantidad', dataIndex: 'quantity' },
      { title: 'Peso', render: (_, item) => item.weight ?? '—' },
      { title: 'Volumen', render: (_, item) => item.volume ?? '—' },
      { title: 'FOB unitario', render: (_, item) => money(item.fobUnitCost, value.currencyCode) },
      { title: 'FOB total', render: (_, item) => money(item.fobTotal, value.currencyCode) },
      { title: 'Gastos asignados', render: (_, item) => money(item.allocatedCapitalizableCost, value.currencyCode) },
      { title: 'Costo unitario', render: (_, item) => money(item.unitCost, value.currencyCode) },
      { title: 'Costo total', render: (_, item) => money(item.totalCost, value.currencyCode) },
    ]} />
    <Table style={{ marginTop: 16 }} rowKey="id" pagination={false} dataSource={value.costs} expandable={{ expandedRowRender: (cost) => <Table rowKey="id" size="small" pagination={false} dataSource={cost.allocations} columns={[
      { title: 'Producto', render: (_, allocation) => value.details.find((item) => item.id === allocation.retaceoDetailId)?.product.name || allocation.retaceoDetailId },
      { title: 'Base', dataIndex: 'baseValue' }, { title: 'Factor', dataIndex: 'allocationFactor' },
      { title: 'Asignado', render: (_, allocation) => money(allocation.allocatedCost, value.currencyCode) },
      { title: 'Redondeo', dataIndex: 'roundingAdjustment' },
    ]} /> }} columns={[
      { title: '#', dataIndex: 'lineNumber', width: 55 },
      { title: 'Costo', render: (_, item) => item.expenseType.name },
      { title: 'Descripción', render: (_, item) => item.description || '—' },
      { title: 'Importe', render: (_, item) => money(item.baseAmount, value.currencyCode) },
      { title: 'Método', dataIndex: 'allocationMethod' },
      { title: 'Tratamiento', render: (_, item) => item.isRecoverableTax ? 'Recuperable' : item.isCapitalizable ? 'Capitalizable' : 'No capitalizable' },
    ]} />
  </>;
}
