import { CalculatorOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Card, DatePicker, Input, Modal, Popconfirm, Select, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Can } from '@/components/authorization/Can.jsx';
import { DataTable } from '@/components/tables/DataTable.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { permissions } from '@/config/permissions.js';
import { listCountries } from '@/modules/companies/catalogs.api.js';
import * as suppliersApi from '@/modules/suppliers/suppliers.api.js';
import { RetaceoCosts } from '../components/RetaceoCosts.jsx';
import { RetaceoDetails } from '../components/RetaceoDetails.jsx';
import { RetaceoForm } from '../components/RetaceoForm.jsx';
import { RetaceoManualAllocationForm } from '../components/RetaceoManualAllocationForm.jsx';
import * as api from '../retaceos.api.js';
import { statusColors, statusLabels } from '../retaceos.constants.js';

const initialFilters = { page: 1, pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' };
const date = (value) => value ? dayjs(value).format('DD/MM/YYYY') : '—';
const money = (value, currency) => `${Number(value ?? 0).toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;

export function RetaceoListPage() {
  const { message, modal: dialog } = App.useApp();
  const client = useQueryClient();
  const [filters, setFilters] = useState(initialFilters);
  const [editing, setEditing] = useState(null);
  const [detailsId, setDetailsId] = useState(null);
  const [manualTarget, setManualTarget] = useState(null);
  const list = useQuery({
    queryKey: ['retaceos', 'list', filters], queryFn: () => api.listRetaceos(filters),
  });
  const suppliers = useQuery({
    queryKey: ['suppliers', 'retaceo-filter'],
    queryFn: () => suppliersApi.listSuppliers({
      page: 1, pageSize: 100, sortBy: 'name', sortOrder: 'asc',
    }),
    staleTime: 300_000,
  });
  const countries = useQuery({
    queryKey: ['catalogs', 'countries', 'retaceo-filter'],
    queryFn: listCountries,
    staleTime: 300_000,
  });
  const details = useQuery({
    queryKey: ['retaceos', 'detail', detailsId], queryFn: () => api.getRetaceo(detailsId), enabled: Boolean(detailsId),
  });
  const save = useMutation({
    mutationFn: ({ item, data }) => item === 'create' ? api.createRetaceo(data) : api.updateRetaceo(item, data),
  });
  const calculate = useMutation({ mutationFn: ({ item, allocations }) => api.calculateRetaceo(item, allocations) });
  const transition = useMutation({ mutationFn: ({ item, action, reason }) => api.transitionRetaceo(item, action, reason) });
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: ['retaceos', 'list'] });
    if (detailsId) await details.refetch();
  };
  async function executeCalculation(item, allocations = []) {
    try {
      await calculate.mutateAsync({ item, allocations });
      setManualTarget(null); await refresh(); message.success('Retaceo calculado correctamente.');
    } catch (error) { message.error(error.message); }
  }
  function startCalculation(item) {
    if (item.costs.some((cost) => cost.isCapitalizable && cost.allocationMethod === 'MANUAL')) setManualTarget(item);
    else void executeCalculation(item);
  }
  async function change(item, action, reason) {
    try {
      await transition.mutateAsync({ item, action, reason });
      await refresh(); message.success('Estado del retaceo actualizado.');
    } catch (error) { message.error(error.message); }
  }
  function cancel(item) {
    let reason = '';
    dialog.confirm({
      title: 'Cancelar retaceo',
      content: <Input.TextArea autoFocus rows={3} placeholder="Motivo obligatorio" onChange={(event) => { reason = event.target.value; }} />,
      okText: 'Cancelar retaceo', okButtonProps: { danger: true },
      onOk: async () => {
        if (!reason.trim()) { message.warning('Ingresa un motivo.'); throw new Error('reason required'); }
        await change(item, 'cancel', reason.trim());
      },
    });
  }
  const columns = [
    { title: 'Código', dataIndex: 'code', sorter: true },
    { title: 'Compra', render: (_, item) => item.purchase.code },
    { title: 'Proveedor', render: (_, item) => item.supplier.name },
    { title: 'País de origen', render: (_, item) => item.originCountry.name },
    { title: 'Fecha', key: 'retaceoDate', render: (_, item) => date(item.retaceoDate), sorter: true },
    { title: 'FOB', render: (_, item) => money(item.totalFob, item.currencyCode) },
    { title: 'Costo real', key: 'totalLandedCost', render: (_, item) => money(item.totalLandedCost, item.currencyCode), sorter: true },
    { title: 'Estado', key: 'status', render: (_, item) => <Tag color={statusColors[item.status]}>{statusLabels[item.status]}</Tag>, sorter: true },
    { title: 'Acciones', render: (_, item) => <Space wrap>
      <Button icon={<EyeOutlined />} onClick={() => setDetailsId(item.id)} />
      {item.status === 'DRAFT' ? <Can permission={permissions.retaceos.update}><Button icon={<EditOutlined />} onClick={() => setEditing(item)} /></Can> : null}
      {item.status === 'DRAFT' ? <Can permission={permissions.retaceos.calculate}><Popconfirm title="¿Calcular este retaceo?" description="Se congelarán las bases y distribuciones." onConfirm={() => startCalculation(item)}><Button type="primary" icon={<CalculatorOutlined />}>Calcular</Button></Popconfirm></Can> : null}
      {item.status === 'CALCULATED' ? <Can permission={permissions.retaceos.verify}><Popconfirm title="¿Verificar la cuadratura del retaceo?" onConfirm={() => change(item, 'verify')}><Button>Verificar</Button></Popconfirm></Can> : null}
      {item.status === 'VERIFIED' ? <Can permission={permissions.retaceos.close}><Popconfirm title="¿Cerrar definitivamente el retaceo?" onConfirm={() => change(item, 'close')}><Button type="primary">Cerrar</Button></Popconfirm></Can> : null}
      {['DRAFT', 'CALCULATED', 'VERIFIED'].includes(item.status) ? <Can permission={permissions.retaceos.cancel}><Button danger onClick={() => cancel(item)}>Cancelar</Button></Can> : null}
    </Space> },
  ];
  const value = details.data;
  return <>
    <PageHeader title="Retaceos" description="Distribuye los costos de importación y determina el costo real de los productos recibidos." extra={<Can permission={permissions.retaceos.create}><Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing('create')}>Nuevo retaceo</Button></Can>} />
    <Card>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search allowClear placeholder="Código, compra, proveedor o documento" style={{ width: 330 }} onSearch={(search) => setFilters((current) => ({ ...current, page: 1, search: search || undefined }))} />
        <DatePicker.RangePicker
          placeholder={['Desde', 'Hasta']}
          onChange={(range) => setFilters((current) => ({
            ...current,
            page: 1,
            dateFrom: range?.[0]?.startOf('day').toISOString(),
            dateTo: range?.[1]?.endOf('day').toISOString(),
          }))}
        />
        <Select allowClear placeholder="Todos los estados" style={{ width: 210 }} options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))} onChange={(status) => setFilters((current) => ({ ...current, page: 1, status }))} />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Todos los proveedores"
          style={{ width: 250 }}
          loading={suppliers.isLoading}
          options={suppliers.data?.suppliers.map((item) => ({
            value: item.id,
            label: `${item.code} · ${item.name}`,
          }))}
          onChange={(supplierId) => setFilters((current) => ({
            ...current, page: 1, supplierId,
          }))}
        />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Todos los países"
          style={{ width: 220 }}
          loading={countries.isLoading}
          options={countries.data?.map((item) => ({
            value: item.id,
            label: item.name,
          }))}
          onChange={(originCountryId) => setFilters((current) => ({
            ...current, page: 1, originCountryId,
          }))}
        />
      </Space>
      <DataTable ariaLabel="Retaceos" columns={columns} dataSource={list.data?.retaceos} isLoading={list.isLoading} error={list.error} onRetry={list.refetch} pagination={list.data?.pagination ?? { ...filters, total: 0 }} onChange={(next) => setFilters((current) => ({ ...current, ...Object.fromEntries(Object.entries(next).filter(([key, value]) => key !== 'filters' && value !== undefined)) }))} />
    </Card>
    <Modal title={editing === 'create' ? 'Nuevo retaceo' : 'Editar retaceo'} open={Boolean(editing)} footer={null} width={1100} onCancel={() => setEditing(null)} destroyOnHidden>
      <RetaceoForm initialValues={editing === 'create' ? null : editing} isSubmitting={save.isPending} onCancel={() => setEditing(null)} onSubmit={async (data) => {
        try { const result = await save.mutateAsync({ item: editing, data }); await refresh(); setEditing(null); setDetailsId(result.id); message.success('Borrador de retaceo guardado.'); }
        catch (error) { message.error(error.message); }
      }} />
    </Modal>
    <Modal title={value ? `Retaceo ${value.code}` : 'Detalle del retaceo'} open={Boolean(detailsId)} footer={null} width={1250} onCancel={() => setDetailsId(null)} loading={details.isLoading} destroyOnHidden>
      {value ? <><RetaceoDetails value={value} />{value.status === 'DRAFT' ? <Can permission={permissions.retaceos.update}><RetaceoCosts retaceo={value} onChange={refresh} /></Can> : null}</> : null}
    </Modal>
    <Modal title="Distribución manual" open={Boolean(manualTarget)} footer={null} width={950} onCancel={() => setManualTarget(null)} destroyOnHidden>
      {manualTarget ? <RetaceoManualAllocationForm retaceo={manualTarget} isSubmitting={calculate.isPending} onCancel={() => setManualTarget(null)} onSubmit={(allocations) => executeCalculation(manualTarget, allocations)} /> : null}
    </Modal>
  </>;
}
