import { EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Card, Descriptions, Modal, Space, Spin } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useMemo, useState } from 'react';
import { Can } from '@/components/authorization/Can.jsx';
import { DataTable } from '@/components/tables/DataTable.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';
import { permissions } from '@/config/permissions.js';
import { ProductDictionaryForm } from '../components/ProductDictionaryForm.jsx';
import {
  brandsApi,
  productCategoriesApi,
} from '../product-dictionaries.api.js';
const filters = { page: 1, pageSize: 100, sortBy: 'name', sortOrder: 'asc' };
const settings = {
  brand: {
    title: 'Marcas',
    singular: 'marca',
    description:
      'Marcas comerciales disponibles para los productos de la empresa.',
    api: brandsApi,
    key: 'brands',
    permissions: permissions.brands,
  },
  category: {
    title: 'Categorías de productos',
    singular: 'categoría',
    description:
      'Categorías y subcategorías utilizadas para organizar los productos.',
    api: productCategoriesApi,
    key: 'productCategories',
    permissions: permissions.productCategories,
  },
};
export function ProductDictionaryPage({ kind }) {
  const config = settings[kind],
    { message } = App.useApp(),
    client = useQueryClient();
  const [modal, setModal] = useState(null);
  const [detailsId, setDetailsId] = useState(null);
  const queryKey = [config.key, 'list', filters];
  const query = useQuery({ queryKey, queryFn: () => config.api.list(filters) });
  const detailsQuery = useQuery({
    queryKey: [config.key, 'detail', Number(detailsId)],
    queryFn: () => config.api.get(detailsId),
    enabled: Boolean(detailsId),
  });
  const details = detailsQuery.data;
  const create = useMutation({ mutationFn: config.api.create });
  const update = useMutation({
    mutationFn: ({ id, data }) => config.api.update(id, data),
  });
  const status = useMutation({
    mutationFn: ({ item, next }) => config.api.changeStatus(item, next),
  });
  const rows = query.data?.[config.key] ?? [];
  const parents =
    kind === 'category'
      ? rows
          .filter(
            (x) => !x.parentCategoryId && x.isActive && x.id !== modal?.id,
          )
          .map((x) => ({ value: x.id, label: `${x.code} · ${x.name}` }))
      : [];
  const refresh = useCallback(
    () => client.invalidateQueries({ queryKey: [config.key] }),
    [client, config.key],
  );
  async function submit(data) {
    try {
      if (modal === 'create') await create.mutateAsync(data);
      else
        await update.mutateAsync({
          id: modal.id,
          data: { ...data, expectedUpdatedAt: modal.updatedAt },
        });
      await refresh();
      setModal(null);
      message.success(
        `${config.singular[0].toUpperCase()}${config.singular.slice(1)} guardada.`,
      );
    } catch (error) {
      message.error(error.message);
    }
  }
  const columns = useMemo(
    () => [
      { title: 'Código', dataIndex: 'code' },
      { title: 'Nombre', dataIndex: 'name' },
      ...(kind === 'category'
        ? [
            {
              title: 'Categoría padre',
              render: (_, x) => x.parent?.name ?? '—',
            },
          ]
        : []),
      { title: 'Descripción', dataIndex: 'description' },
      {
        title: 'Estado',
        dataIndex: 'isActive',
        render: (v) => <StatusBadge status={v ? 'ACTIVE' : 'INACTIVE'} />,
      },
      {
        title: 'Acciones',
        render: (_, item) => (
          <Space>
            <Can permission={config.permissions.read}>
              <Button
                icon={<EyeOutlined />}
                aria-label={`Ver detalle de ${item.name}`}
                onClick={() => setDetailsId(item.id)}
              />
            </Can>
            <Can permission={config.permissions.update}>
              <Button icon={<EditOutlined />} onClick={() => setModal(item)} />
            </Can>
            <Can permission={config.permissions.changeStatus}>
              <Button
                loading={status.isPending}
                onClick={async () => {
                  try {
                    await status.mutateAsync({ item, next: !item.isActive });
                    await refresh();
                    message.success('Estado actualizado.');
                  } catch (error) {
                    message.error(error.message);
                  }
                }}
              >
                {item.isActive ? 'Desactivar' : 'Activar'}
              </Button>
            </Can>
          </Space>
        ),
      },
    ],
    [config, kind, message, refresh, status],
  );
  return (
    <>
      <PageHeader
        title={config.title}
        description={config.description}
        extra={
          <Can permission={config.permissions.create}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModal('create')}
            >
              Nueva {config.singular}
            </Button>
          </Can>
        }
      />
      <Card>
        <DataTable
          ariaLabel={config.title}
          columns={columns}
          dataSource={rows}
          isLoading={query.isLoading}
          error={query.error}
          onRetry={query.refetch}
          pagination={query.data?.pagination ?? { ...filters, total: 0 }}
        />
      </Card>
      <Modal
        title={
          modal === 'create'
            ? `Nueva ${config.singular}`
            : `Editar ${config.singular}`
        }
        open={Boolean(modal)}
        footer={null}
        onCancel={() => setModal(null)}
        destroyOnHidden
      >
        {modal ? (
          <ProductDictionaryForm
            kind={kind}
            initialValues={modal === 'create' ? null : modal}
            parentOptions={parents}
            isSubmitting={create.isPending || update.isPending}
            onCancel={() => setModal(null)}
            onSubmit={submit}
          />
        ) : null}
      </Modal>
      <Modal
        title={details?.name ?? `Detalle de ${config.singular}`}
        open={Boolean(detailsId)}
        footer={null}
        width={760}
        onCancel={() => setDetailsId(null)}
        destroyOnHidden
      >
        {detailsQuery.isLoading ? (
          <div style={{ display: 'grid', minHeight: 160, placeItems: 'center' }}>
            <Spin />
          </div>
        ) : detailsQuery.isError ? (
          <Alert
            showIcon
            type="error"
            message={`No fue posible cargar la ${config.singular}.`}
            description={detailsQuery.error.message}
            action={<Button onClick={() => detailsQuery.refetch()}>Reintentar</Button>}
          />
        ) : details ? (
          <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
            <Descriptions.Item label="ID">{details.id}</Descriptions.Item>
            <Descriptions.Item label="Código">{details.code}</Descriptions.Item>
            <Descriptions.Item label="Estado" span={2}>
              <StatusBadge status={details.isActive ? 'ACTIVE' : 'INACTIVE'} />
            </Descriptions.Item>
            {kind === 'brand' ? (
              <>
                <Descriptions.Item label="Sitio web" span={2}>
                  {details.website ?? '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Referencia del logo" span={2}>
                  {details.logoStorageKey ?? '—'}
                </Descriptions.Item>
              </>
            ) : (
              <>
                <Descriptions.Item label="Tipo" span={2}>
                  {details.parentCategoryId
                    ? 'Subcategoría'
                    : 'Categoría principal'}
                </Descriptions.Item>
                <Descriptions.Item label="Categoría padre" span={2}>
                  {details.parent
                    ? `${details.parent.code} — ${details.parent.name}`
                    : 'Categoría principal'}
                </Descriptions.Item>
                {details.parent ? (
                  <Descriptions.Item label="Estado de la categoría padre" span={2}>
                    <StatusBadge
                      status={details.parent.isActive ? 'ACTIVE' : 'INACTIVE'}
                    />
                  </Descriptions.Item>
                ) : null}
                <Descriptions.Item label="Subcategorías directas" span={2}>
                  {details._count?.children ?? 0}
                </Descriptions.Item>
              </>
            )}
            <Descriptions.Item label="Descripción" span={2}>
              {details.description ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Creada">
              {dayjs(details.createdAt).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Última actualización">
              {dayjs(details.updatedAt).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>
    </>
  );
}

export function BrandListPage() {
  return <ProductDictionaryPage kind="brand" />;
}

export function ProductCategoryListPage() {
  return <ProductDictionaryPage kind="category" />;
}
