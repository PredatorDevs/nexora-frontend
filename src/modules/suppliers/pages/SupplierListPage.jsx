import { ContactsOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Card, Modal, Space } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import { queryKeys } from '@/api/query-keys.js';
import { Can } from '@/components/authorization/Can.jsx';
import { DataTable } from '@/components/tables/DataTable.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';
import { permissions } from '@/config/permissions.js';
import { SupplierContactsPanel } from '@/modules/suppliers/components/SupplierContactsPanel.jsx';
import { SupplierForm } from '@/modules/suppliers/components/SupplierForm.jsx';
import * as api from '@/modules/suppliers/suppliers.api.js';

const filters = { page: 1, pageSize: 100, sortBy: 'name', sortOrder: 'asc' };
export function SupplierListPage() {
  const { message } = App.useApp();
  const client = useQueryClient();
  const [editor, setEditor] = useState(null);
  const [contactsSupplier, setContactsSupplier] = useState(null);
  const query = useQuery({ queryKey: queryKeys.suppliers.list(filters), queryFn: () => api.listSuppliers(filters) });
  const create = useMutation({ mutationFn: api.createSupplier });
  const update = useMutation({ mutationFn: ({ id, data }) => api.updateSupplier(id, data) });
  const status = useMutation({ mutationFn: ({ supplier, next }) => api.changeSupplierStatus(supplier.id, next, supplier.updatedAt) });
  const refresh = useCallback(() => client.invalidateQueries({ queryKey: queryKeys.suppliers.all }), [client]);
  async function submit(data) {
    try {
      if (editor === 'create') {
        await create.mutateAsync(data);
        message.success('Proveedor creado.');
      } else {
        await update.mutateAsync({ id: editor.id, data: { ...data, expectedUpdatedAt: editor.updatedAt } });
        message.success('Proveedor actualizado.');
      }
      await refresh();
      setEditor(null);
    } catch (error) {
      message.error(error.message);
    }
  }
  const columns = useMemo(() => [
    { title: 'Código', dataIndex: 'code' },
    { title: 'Proveedor', dataIndex: 'name' },
    { title: 'País', render: (_, item) => item.country?.name },
    { title: 'NIT / Identificación fiscal', dataIndex: 'nit' },
    { title: 'Teléfono', dataIndex: 'phone' },
    { title: 'Correo', dataIndex: 'email' },
    { title: 'Estado', dataIndex: 'isActive', render: (value) => <StatusBadge status={value ? 'ACTIVE' : 'INACTIVE'} /> },
    {
      title: 'Acciones',
      render: (_, supplier) => <Space>
        <Can permission={permissions.suppliers.update}>
          <Button icon={<EditOutlined />} aria-label={`Editar ${supplier.name}`} onClick={() => setEditor(supplier)} />
        </Can>
        <Can permission={permissions.supplierContacts.read}>
          <Button icon={<ContactsOutlined />} onClick={() => setContactsSupplier(supplier)}>Contactos</Button>
        </Can>
        <Can permission={permissions.suppliers.changeStatus}>
          <Button loading={status.isPending} onClick={async () => {
            try {
              await status.mutateAsync({ supplier, next: !supplier.isActive });
              await refresh();
              message.success('Estado actualizado.');
            } catch (error) {
              message.error(error.message);
            }
          }}>{supplier.isActive ? 'Desactivar' : 'Activar'}</Button>
        </Can>
      </Space>,
    },
  ], [message, refresh, status]);
  return <>
    <PageHeader
      title="Proveedores"
      description="Administra proveedores, información tributaria y contactos comerciales."
      extra={<Can permission={permissions.suppliers.create}><Button type="primary" icon={<PlusOutlined />} onClick={() => setEditor('create')}>Nuevo proveedor</Button></Can>}
    />
    <Card><DataTable ariaLabel="Proveedores" columns={columns} dataSource={query.data?.suppliers} isLoading={query.isLoading} error={query.error} onRetry={query.refetch} pagination={query.data?.pagination ?? { ...filters, total: 0 }} /></Card>
    <Modal title={editor === 'create' ? 'Nuevo proveedor' : 'Editar proveedor'} open={Boolean(editor)} footer={null} width={900} onCancel={() => setEditor(null)} destroyOnHidden>
      {editor ? <SupplierForm key={editor === 'create' ? 'create' : editor.id} initialValues={editor === 'create' ? null : editor} isSubmitting={create.isPending || update.isPending} onCancel={() => setEditor(null)} onSubmit={submit} /> : null}
    </Modal>
    <Modal title={contactsSupplier ? `Contactos — ${contactsSupplier.name}` : 'Contactos'} open={Boolean(contactsSupplier)} footer={null} width={1100} onCancel={() => setContactsSupplier(null)} destroyOnHidden>
      {contactsSupplier ? <SupplierContactsPanel supplier={contactsSupplier} /> : null}
    </Modal>
  </>;
}
