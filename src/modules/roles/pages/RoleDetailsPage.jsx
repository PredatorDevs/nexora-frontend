import { App, Button, Card, Descriptions, Space, Tag, Typography } from 'antd';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { routes } from '@/app/routes.js';
import { useAuth } from '@/auth/useAuth.js';
import { Can } from '@/components/authorization/Can.jsx';
import { ErrorState } from '@/components/feedback/ErrorState.jsx';
import { LoadingState } from '@/components/feedback/LoadingState.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { permissions } from '@/config/permissions.js';
import { usePermissionCatalog } from '@/modules/permissions/hooks/usePermissions.js';
import { PermissionMatrix } from '@/modules/roles/components/PermissionMatrix.jsx';
import { useRole, useRoleMutations } from '@/modules/roles/hooks/useRoles.js';

export function RoleDetailsPage() {
  const { id } = useParams();
  const { message } = App.useApp();
  const { hasPermission } = useAuth();
  const query = useRole(id);
  const canAssign =
    hasPermission(permissions.roles.assignPermissions) &&
    hasPermission(permissions.permissions.read);
  const catalog = usePermissionCatalog(canAssign);
  const { replacePermissions } = useRoleMutations();
  const [selected, setSelected] = useState(null);
  if (query.isLoading) return <LoadingState />;
  if (query.error)
    return <ErrorState error={query.error} onRetry={query.refetch} />;
  const role = query.data;
  const value =
    selected ?? role.permissions.map(({ permission }) => permission.code);
  return (
    <>
      <PageHeader
        title={role.name}
        description={role.code}
        extra={
          <Can permission={permissions.roles.update}>
            <Button>
              <Link to={`${routes.roles}/${id}/edit`}>Editar</Link>
            </Button>
          </Can>
        }
      />
      <Space orientation="vertical" size="large" className="full-width">
        <Card>
          <Descriptions
            column={{ xs: 1, md: 2 }}
            items={[
              {
                key: 'type',
                label: 'Tipo',
                children: (
                  <Tag color={role.isSystem ? 'blue' : 'default'}>
                    {role.isSystem ? 'Sistema' : 'Personalizado'}
                  </Tag>
                ),
              },
              {
                key: 'code',
                label: 'Código',
                children: <Typography.Text code>{role.code}</Typography.Text>,
              },
              {
                key: 'description',
                label: 'Descripción',
                children: role.description || 'Sin descripción',
                span: 2,
              },
            ]}
          />
        </Card>
        <Can
          allOf={[
            permissions.roles.assignPermissions,
            permissions.permissions.read,
          ]}
          fallback={
            <Card title="Permisos">
              <Space wrap>
                {role.permissions.map(({ permission }) => (
                  <Tag key={permission.code}>{permission.code}</Tag>
                ))}
              </Space>
            </Card>
          }
        >
          <Card
            title="Permisos"
            extra={
              <Button
                type="primary"
                disabled={selected === null}
                loading={replacePermissions.isPending}
                onClick={async () => {
                  try {
                    await replacePermissions.mutateAsync({
                      id: role.id,
                      permissionCodes: value,
                      expectedUpdatedAt: role.updatedAt,
                    });
                    message.success('Permisos actualizados.');
                    setSelected(null);
                  } catch (error) {
                    message.error(error.message);
                  }
                }}
              >
                Guardar permisos
              </Button>
            }
          >
            {catalog.error ? (
              <ErrorState
                compact
                error={catalog.error}
                onRetry={catalog.refetch}
              />
            ) : catalog.isLoading ? (
              <LoadingState />
            ) : (
              <PermissionMatrix
                permissions={catalog.data ?? []}
                value={value}
                onChange={setSelected}
                disabled={replacePermissions.isPending}
              />
            )}
          </Card>
        </Can>
      </Space>
    </>
  );
}
