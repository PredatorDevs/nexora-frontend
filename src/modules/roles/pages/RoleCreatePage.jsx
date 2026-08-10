import { App, Card } from 'antd';
import { useNavigate } from 'react-router';
import { routes } from '@/app/routes.js';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { RoleForm } from '@/modules/roles/components/RoleForm.jsx';
import { useRoleMutations } from '@/modules/roles/hooks/useRoles.js';

export function RoleCreatePage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { create } = useRoleMutations();
  return (
    <>
      <PageHeader
        title="Nuevo rol"
        description="Define una agrupación reutilizable de permisos."
      />
      <Card>
        <RoleForm
          mode="create"
          onCancel={() => navigate(routes.roles)}
          onSubmit={async (data) => {
            const role = await create.mutateAsync(data);
            message.success('Rol creado.');
            navigate(`${routes.roles}/${role.id}`);
          }}
        />
      </Card>
    </>
  );
}
