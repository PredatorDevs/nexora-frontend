import { App, Card } from 'antd';
import { useNavigate } from 'react-router';
import { routes } from '@/app/routes.js';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { UserForm } from '@/modules/users/components/UserForm.jsx';
import { useUserMutations } from '@/modules/users/hooks/useUsers.js';

export function UserCreatePage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { create } = useUserMutations();
  return (
    <>
      <PageHeader
        title="Nuevo usuario"
        description="Crea una identidad administrativa con una contraseña temporal."
      />
      <Card>
        <UserForm
          mode="create"
          onCancel={() => navigate(routes.users)}
          onSubmit={async (data) => {
            const user = await create.mutateAsync(data);
            message.success('Usuario creado.');
            navigate(`${routes.users}/${user.id}`);
          }}
        />
      </Card>
    </>
  );
}
