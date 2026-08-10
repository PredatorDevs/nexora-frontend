import { EyeOutlined } from '@ant-design/icons';
import {
  AutoComplete,
  Button,
  Card,
  DatePicker,
  Input,
  InputNumber,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useSearchParams } from 'react-router';

import { FilterBar } from '@/components/forms/FilterBar.jsx';
import { DataTable } from '@/components/tables/DataTable.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { EntityChangeDetails } from '@/modules/entity-changes/components/EntityChangeDetails.jsx';
import { useEntityChanges } from '@/modules/entity-changes/hooks/useEntityChanges.js';

const { RangePicker } = DatePicker;
const entityTypeOptions = [
  { value: 'user', label: 'Usuario' },
  { value: 'role', label: 'Rol' },
];

function defaultRange() {
  return {
    from: dayjs().subtract(6, 'day').startOf('day').toISOString(),
    to: dayjs().endOf('day').toISOString(),
  };
}

function readFilters(params) {
  const actorUserId = Number(params.get('actorUserId'));
  const operation = params.get('operation');
  const defaults = defaultRange();
  return {
    page: Math.max(1, Number(params.get('page')) || 1),
    pageSize: Math.min(50, Math.max(1, Number(params.get('pageSize')) || 20)),
    schemaName: params.get('schemaName') || 'administration',
    entityType: params.get('entityType') || undefined,
    entityId: params.get('entityId') || undefined,
    operation: ['CREATE', 'UPDATE', 'DELETE'].includes(operation)
      ? operation
      : undefined,
    actorUserId:
      Number.isInteger(actorUserId) && actorUserId > 0
        ? actorUserId
        : undefined,
    from: params.get('from') || defaults.from,
    to: params.get('to') || defaults.to,
  };
}

function formatDate(value) {
  return new Intl.DateTimeFormat('es', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(value));
}

export function EntityChangeListPage() {
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const [draft, setDraft] = useState(filters);
  const [detailId, setDetailId] = useState(null);
  const query = useEntityChanges(filters);

  function applyFilters(values) {
    setParams(
      Object.fromEntries(
        Object.entries(values).filter(
          ([, value]) => value !== undefined && value !== '',
        ),
      ),
    );
  }

  const columns = [
    {
      title: 'Fecha',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: formatDate,
    },
    {
      title: 'Operación',
      dataIndex: 'operation',
      key: 'operation',
      render: (value) => <Tag>{value}</Tag>,
    },
    {
      title: 'Entidad',
      key: 'entity',
      render: (_, change) => (
        <Space orientation="vertical" size={0}>
          <Typography.Text>
            {change.schemaName}.{change.entityType}
          </Typography.Text>
          <Typography.Text type="secondary">{change.entityId}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Campos modificados',
      dataIndex: 'changedFields',
      key: 'changedFields',
      render: (fields) =>
        Array.isArray(fields) && fields.length
          ? fields.map((field) => <Tag key={field}>{field}</Tag>)
          : '—',
    },
    {
      title: 'Actor',
      dataIndex: 'actorUserId',
      key: 'actorUserId',
      render: (value) => value ?? 'Sistema',
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, change) => (
        <Button
          aria-label={`Ver cambio ${change.id}`}
          icon={<EyeOutlined />}
          onClick={() => setDetailId(change.id)}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Historial de cambios"
        description="Consulta estados anteriores y nuevos de entidades críticas."
      />
      <Card>
        <FilterBar
          actions={
            <Space>
              <Button
                onClick={() => {
                  const range = defaultRange();
                  const cleared = {
                    page: 1,
                    pageSize: filters.pageSize,
                    schemaName: 'administration',
                    ...range,
                  };
                  setDraft(cleared);
                  applyFilters(cleared);
                }}
              >
                Limpiar
              </Button>
              <Button
                type="primary"
                onClick={() =>
                  applyFilters({
                    ...draft,
                    page: 1,
                    pageSize: filters.pageSize,
                  })
                }
              >
                Aplicar
              </Button>
            </Space>
          }
        >
          <RangePicker
            showTime
            value={
              draft.from && draft.to
                ? [dayjs(draft.from), dayjs(draft.to)]
                : null
            }
            onChange={(range) =>
              setDraft((current) => ({
                ...current,
                from: range?.[0]?.toISOString(),
                to: range?.[1]?.toISOString(),
              }))
            }
          />
          <AutoComplete
            allowClear
            value={draft.entityType}
            options={entityTypeOptions}
            placeholder="Tipo de entidad"
            onChange={(entityType) =>
              setDraft((current) => ({
                ...current,
                entityType: entityType || undefined,
              }))
            }
          />
          <Input
            allowClear
            value={draft.entityId}
            placeholder="ID de entidad"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                entityId: event.target.value || undefined,
              }))
            }
          />
          <Select
            allowClear
            value={draft.operation}
            placeholder="Operación"
            options={['CREATE', 'UPDATE', 'DELETE'].map((value) => ({
              value,
              label: value,
            }))}
            onChange={(operation) =>
              setDraft((current) => ({ ...current, operation }))
            }
          />
          <InputNumber
            min={1}
            precision={0}
            value={draft.actorUserId}
            placeholder="ID del actor"
            onChange={(actorUserId) =>
              setDraft((current) => ({
                ...current,
                actorUserId: actorUserId || undefined,
              }))
            }
          />
        </FilterBar>
        <DataTable
          ariaLabel="Historial de cambios"
          columns={columns}
          dataSource={query.data?.changes}
          error={query.error}
          isLoading={query.isLoading || query.isFetching}
          onRetry={query.refetch}
          pagination={query.data?.pagination ?? { ...filters, total: 0 }}
          onChange={({ page, pageSize }) =>
            applyFilters({ ...filters, page, pageSize })
          }
        />
      </Card>
      <EntityChangeDetails
        changeId={detailId}
        open={Boolean(detailId)}
        onClose={() => setDetailId(null)}
      />
    </>
  );
}
