import { App, Card } from 'antd';
import { useNavigate, useParams } from 'react-router';
import { routes } from '@/app/routes.js';
import { ErrorState } from '@/components/feedback/ErrorState.jsx';
import { LoadingState } from '@/components/feedback/LoadingState.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { RoleForm } from '@/modules/roles/components/RoleForm.jsx';
import { useRole, useRoleMutations } from '@/modules/roles/hooks/useRoles.js';

export function RoleEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const query = useRole(id);
  const { update } = useRoleMutations();
  if (query.isLoading) return <LoadingState />;
  if (query.error)
    return <ErrorState error={query.error} onRetry={query.refetch} />;
  return (
    <>
      <PageHeader title="Editar rol" description={query.data.code} />
      <Card>
        <RoleForm
          mode="edit"
          initialValues={query.data}
          onCancel={() => navigate(`${routes.roles}/${id}`)}
          onSubmit={async (data) => {
            await update.mutateAsync({
              id: Number(id),
              data: { ...data, expectedUpdatedAt: query.data.updatedAt },
            });
            message.success('Rol actualizado.');
            navigate(`${routes.roles}/${id}`);
          }}
        />
      </Card>
    </>
  );
}
