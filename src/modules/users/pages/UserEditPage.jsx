import { App, Card } from 'antd';
import { useNavigate, useParams } from 'react-router';
import { ErrorState } from '@/components/feedback/ErrorState.jsx';
import { LoadingState } from '@/components/feedback/LoadingState.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { routes } from '@/app/routes.js';
import { UserForm } from '@/modules/users/components/UserForm.jsx';
import { useUser, useUserMutations } from '@/modules/users/hooks/useUsers.js';
export function UserEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const query = useUser(id);
  const { update } = useUserMutations();
  if (query.isLoading) return <LoadingState />;
  if (query.error)
    return <ErrorState error={query.error} onRetry={query.refetch} />;
  return (
    <>
      <PageHeader title="Editar usuario" description={query.data.email} />
      <Card>
        <UserForm
          mode="edit"
          initialValues={query.data}
          onCancel={() => navigate(`${routes.users}/${id}`)}
          onSubmit={async (data) => {
            await update.mutateAsync({
              id: Number(id),
              data: { ...data, expectedUpdatedAt: query.data.updatedAt },
            });
            message.success('Usuario actualizado.');
            navigate(`${routes.users}/${id}`);
          }}
        />
      </Card>
    </>
  );
}
