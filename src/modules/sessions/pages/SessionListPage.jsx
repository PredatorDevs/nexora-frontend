import { EyeOutlined, StopOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  InputNumber,
  Select,
  Space,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Can } from '@/components/authorization/Can.jsx';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog.jsx';
import { FilterBar } from '@/components/forms/FilterBar.jsx';
import { DataTable } from '@/components/tables/DataTable.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';
import { permissions } from '@/config/permissions.js';
import { SessionDetails } from '@/modules/sessions/components/SessionDetails.jsx';
import {
  useSessionMutations,
  useSessions,
} from '@/modules/sessions/hooks/useSessions.js';
import { getSessionStatus } from '@/modules/sessions/schemas/session.schemas.js';

function readFilters(params) {
  const userId = Number(params.get('userId'));
  return {
    page: Math.max(1, Number(params.get('page')) || 1),
    pageSize: Math.min(100, Math.max(1, Number(params.get('pageSize')) || 20)),
    userId: Number.isInteger(userId) && userId > 0 ? userId : undefined,
    activeOnly: params.get('activeOnly') === 'true',
    sortBy: params.get('sortBy') || 'createdAt',
    sortOrder: params.get('sortOrder') === 'asc' ? 'asc' : 'desc',
  };
}

function shortAgent(value) {
  if (!value) return 'Desconocido';
  return value.length > 60 ? `${value.slice(0, 57)}…` : value;
}

export function SessionListPage() {
  const { message } = App.useApp();
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const [detail, setDetail] = useState(null);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const query = useSessions(filters);
  const { revoke } = useSessionMutations();
  function updateFilters(next) {
    const values = { ...filters, ...next };
    setParams(
      Object.fromEntries(
        Object.entries(values).filter(
          ([, value]) => value !== undefined && value !== false && value !== '',
        ),
      ),
    );
  }
  const columns = useMemo(
    () => [
      {
        title: 'Usuario',
        key: 'user',
        render: (_, session) => (
          <Space orientation="vertical" size={0}>
            <Typography.Text>{session.user.displayName}</Typography.Text>
            <Typography.Text type="secondary">
              {session.user.email}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: 'Estado',
        key: 'status',
        render: (_, session) => (
          <StatusBadge status={getSessionStatus(session)} />
        ),
      },
      {
        title: 'IP',
        dataIndex: 'ipAddress',
        key: 'ipAddress',
        render: (value) => value || '—',
      },
      {
        title: 'Dispositivo',
        dataIndex: 'userAgent',
        key: 'userAgent',
        ellipsis: true,
        render: shortAgent,
      },
      {
        title: 'Último uso',
        dataIndex: 'lastUsedAt',
        key: 'lastUsedAt',
        sorter: true,
        render: (value) =>
          value
            ? new Intl.DateTimeFormat('es', {
                dateStyle: 'short',
                timeStyle: 'short',
              }).format(new Date(value))
            : '—',
      },
      {
        title: 'Acciones',
        key: 'actions',
        render: (_, session) => {
          const active = getSessionStatus(session) === 'ACTIVE';
          return (
            <Space>
              <Button
                aria-label={`Ver sesión de ${session.user.displayName}`}
                icon={<EyeOutlined />}
                onClick={() => setDetail(session)}
              />
              <Can permission={permissions.sessions.revoke}>
                <Button
                  danger
                  disabled={!active}
                  icon={<StopOutlined />}
                  onClick={() => setRevokeTarget(session)}
                >
                  Revocar
                </Button>
              </Can>
            </Space>
          );
        },
      },
    ],
    [],
  );
  return (
    <>
      <PageHeader
        title="Sesiones"
        description="Consulta y revoca sesiones administrativas."
      />
      <Card>
        <FilterBar>
          <InputNumber
            min={1}
            precision={0}
            value={filters.userId}
            placeholder="ID de usuario"
            onChange={(value) =>
              updateFilters({ userId: value || undefined, page: 1 })
            }
          />
          <Select
            value={filters.activeOnly ? 'true' : 'false'}
            onChange={(value) =>
              updateFilters({ activeOnly: value === 'true', page: 1 })
            }
            options={[
              { value: 'false', label: 'Todas las sesiones' },
              { value: 'true', label: 'Solo activas' },
            ]}
          />
        </FilterBar>
        <DataTable
          ariaLabel="Sesiones"
          columns={columns}
          dataSource={query.data?.sessions}
          error={query.error}
          isLoading={query.isLoading || query.isFetching}
          onRetry={query.refetch}
          pagination={query.data?.pagination ?? { ...filters, total: 0 }}
          onChange={({ page, pageSize, sortBy, sortOrder }) =>
            updateFilters({
              page,
              pageSize,
              sortBy: sortBy ?? filters.sortBy,
              sortOrder: sortOrder ?? filters.sortOrder,
            })
          }
        />
      </Card>
      <SessionDetails
        session={detail}
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
      />
      <ConfirmDialog
        open={Boolean(revokeTarget)}
        title="Revocar sesión"
        description={`La sesión de ${revokeTarget?.user.displayName ?? 'este usuario'} dejará de renovarse inmediatamente.`}
        confirmText="Revocar"
        danger
        isConfirming={revoke.isPending}
        onCancel={() => setRevokeTarget(null)}
        onConfirm={async () => {
          try {
            await revoke.mutateAsync(revokeTarget.id);
            message.success('Sesión revocada.');
            setRevokeTarget(null);
          } catch (error) {
            message.error(error.message);
          }
        }}
      />
    </>
  );
}
