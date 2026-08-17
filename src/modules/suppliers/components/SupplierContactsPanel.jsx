import { EditOutlined, PlusOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Modal, Space, Table, Tag } from 'antd';
import { useCallback, useState } from 'react';
import { queryKeys } from '@/api/query-keys.js';
import { Can } from '@/components/authorization/Can.jsx';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';
import { permissions } from '@/config/permissions.js';
import { SupplierContactForm } from './SupplierContactForm.jsx';
import * as api from '../suppliers.api.js';

const filters = { page: 1, pageSize: 100, sortBy: 'fullName', sortOrder: 'asc' };
export function SupplierContactsPanel({ supplier }) {
  const { message } = App.useApp();
  const client = useQueryClient();
  const [editor, setEditor] = useState(null);
  const query = useQuery({
    queryKey: queryKeys.suppliers.contacts(supplier.id, filters),
    queryFn: () => api.listSupplierContacts(supplier.id, filters),
  });
  const create = useMutation({ mutationFn: (data) => api.createSupplierContact(supplier.id, data) });
  const update = useMutation({ mutationFn: ({ id, data }) => api.updateSupplierContact(supplier.id, id, data) });
  const status = useMutation({ mutationFn: ({ contact, next }) => api.changeSupplierContactStatus(supplier.id, contact.id, next, contact.updatedAt) });
  const primary = useMutation({ mutationFn: (contact) => api.setPrimarySupplierContact(supplier.id, contact.id, contact.updatedAt) });
  const refresh = useCallback(
    () => client.invalidateQueries({ queryKey: queryKeys.suppliers.contactsAll(supplier.id) }),
    [client, supplier.id],
  );
  async function submit(data) {
    try {
      if (editor === 'create') {
        await create.mutateAsync(data);
        message.success('Contacto creado.');
      } else {
        await update.mutateAsync({ id: editor.id, data: { ...data, expectedUpdatedAt: editor.updatedAt } });
        message.success('Contacto actualizado.');
      }
      await refresh();
      setEditor(null);
    } catch (error) {
      message.error(error.message);
    }
  }
  const columns = [
    {
      title: 'Nombre',
      render: (_, contact) => <Space>{contact.fullName}{contact.isPrimary ? <Tag color="gold" icon={<StarFilled />}>Principal</Tag> : null}</Space>,
    },
    { title: 'Cargo', dataIndex: 'jobTitle' },
    { title: 'Teléfono', dataIndex: 'phone' },
    { title: 'Correo', dataIndex: 'email' },
    { title: 'Estado', dataIndex: 'isActive', render: (value) => <StatusBadge status={value ? 'ACTIVE' : 'INACTIVE'} /> },
    {
      title: 'Acciones',
      render: (_, contact) => <Space>
        <Can permission={permissions.supplierContacts.update}>
          <Button icon={<EditOutlined />} aria-label={`Editar ${contact.fullName}`} onClick={() => setEditor(contact)} />
        </Can>
        <Can permission={permissions.supplierContacts.setPrimary}>
          {!contact.isPrimary && contact.isActive ? (
            <Button icon={<StarOutlined />} loading={primary.isPending} onClick={async () => {
              try {
                await primary.mutateAsync(contact);
                await refresh();
                message.success('Contacto principal actualizado.');
              } catch (error) {
                message.error(error.message);
              }
            }}>Hacer principal</Button>
          ) : null}
        </Can>
        <Can permission={permissions.supplierContacts.changeStatus}>
          <Button loading={status.isPending} onClick={async () => {
            try {
              await status.mutateAsync({ contact, next: !contact.isActive });
              await refresh();
              message.success('Estado actualizado.');
            } catch (error) {
              message.error(error.message);
            }
          }}>{contact.isActive ? 'Desactivar' : 'Activar'}</Button>
        </Can>
      </Space>,
    },
  ];
  return <>
    <Space style={{ marginBottom: 16 }}>
      <Can permission={permissions.supplierContacts.create}>
        <Button type="primary" icon={<PlusOutlined />} disabled={!supplier.isActive} onClick={() => setEditor('create')}>Nuevo contacto</Button>
      </Can>
      {!supplier.isActive ? <Tag color="warning">Activa el proveedor para agregar o reactivar contactos.</Tag> : null}
    </Space>
    <Table rowKey="id" columns={columns} dataSource={query.data?.contacts} loading={query.isLoading} pagination={false} />
    <Modal title={editor === 'create' ? 'Nuevo contacto' : 'Editar contacto'} open={Boolean(editor)} footer={null} onCancel={() => setEditor(null)} destroyOnHidden>
      {editor ? <SupplierContactForm key={editor === 'create' ? 'create' : editor.id} initialValues={editor === 'create' ? null : editor} isSubmitting={create.isPending || update.isPending} onCancel={() => setEditor(null)} onSubmit={submit} /> : null}
    </Modal>
  </>;
}
