import { EyeOutlined } from '@ant-design/icons';
import {
  AutoComplete,
  Button,
  Card,
  InputNumber,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { FilterBar } from '@/components/forms/FilterBar.jsx';
import { DataTable } from '@/components/tables/DataTable.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';
import {
  auditActionOptions,
  resourceTypeOptions,
} from '@/modules/audit/audit.constants.js';
import { AuditDetails } from '@/modules/audit/components/AuditDetails.jsx';
import { useAuditLogs } from '@/modules/audit/hooks/useAuditLogs.js';

function readFilters(params) {
  const actorUserId = Number(params.get('actorUserId'));
  const result = params.get('result');
  return {
    page: Math.max(1, Number(params.get('page')) || 1),
    pageSize: Math.min(100, Math.max(1, Number(params.get('pageSize')) || 20)),
    action: params.get('action') || undefined,
    actorUserId:
      Number.isInteger(actorUserId) && actorUserId > 0
        ? actorUserId
        : undefined,
    resourceType: params.get('resourceType') || undefined,
    result: ['SUCCESS', 'FAILURE'].includes(result) ? result : undefined,
  };
}

const columns = [
  {
    title: 'Fecha',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (value) =>
      new Intl.DateTimeFormat('es', {
        dateStyle: 'short',
        timeStyle: 'medium',
      }).format(new Date(value)),
  },
  {
    title: 'Resultado',
    dataIndex: 'result',
    key: 'result',
    render: (result) => <StatusBadge status={result} />,
  },
  {
    title: 'Acción',
    dataIndex: 'action',
    key: 'action',
    render: (action) => <Tag>{action}</Tag>,
  },
  {
    title: 'Recurso',
    key: 'resource',
    render: (_, event) => (
      <Space orientation="vertical" size={0}>
        <Typography.Text>{event.resourceType}</Typography.Text>
        <Typography.Text type="secondary">
          {event.resourceId || '—'}
        </Typography.Text>
      </Space>
    ),
  },
  {
    title: 'Actor',
    dataIndex: 'actorUserId',
    key: 'actorUserId',
    render: (value) => value ?? 'Anónimo',
  },
];

export function AuditListPage() {
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const [draft, setDraft] = useState(filters);
  const [detail, setDetail] = useState(null);
  const query = useAuditLogs(filters);
  function applyFilters(values) {
    setParams(
      Object.fromEntries(
        Object.entries(values).filter(
          ([, value]) => value !== undefined && value !== '',
        ),
      ),
    );
  }
  const tableColumns = [
    ...columns,
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, event) => (
        <Button
          aria-label={`Ver evento ${event.id}`}
          icon={<EyeOutlined />}
          onClick={() => setDetail(event)}
        />
      ),
    },
  ];
  return (
    <>
      <PageHeader
        title="Auditoría"
        description="Consulta eventos administrativos y de seguridad inmutables."
      />
      <Card>
        <FilterBar
          actions={
            <Space>
              <Button
                onClick={() => {
                  const cleared = { page: 1, pageSize: filters.pageSize };
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
          <AutoComplete
            allowClear
            value={draft.action}
            options={auditActionOptions}
            placeholder="Acción exacta"
            onChange={(action) =>
              setDraft((current) => ({
                ...current,
                action: action || undefined,
              }))
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
          <AutoComplete
            allowClear
            value={draft.resourceType}
            options={resourceTypeOptions}
            placeholder="Tipo de recurso"
            onChange={(resourceType) =>
              setDraft((current) => ({
                ...current,
                resourceType: resourceType || undefined,
              }))
            }
          />
          <Select
            allowClear
            value={draft.result}
            placeholder="Resultado"
            onChange={(result) =>
              setDraft((current) => ({ ...current, result }))
            }
            options={[
              { value: 'SUCCESS', label: 'Exitoso' },
              { value: 'FAILURE', label: 'Fallido' },
            ]}
          />
        </FilterBar>
        <DataTable
          ariaLabel="Auditoría"
          columns={tableColumns}
          dataSource={query.data?.logs}
          error={query.error}
          isLoading={query.isLoading || query.isFetching}
          onRetry={query.refetch}
          pagination={query.data?.pagination ?? { ...filters, total: 0 }}
          onChange={({ page, pageSize }) =>
            applyFilters({ ...filters, page, pageSize })
          }
        />
      </Card>
      <AuditDetails
        event={detail}
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
      />
    </>
  );
}
