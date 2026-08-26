import {
  EditOutlined,
  EyeOutlined,
  PictureOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App,
  Button,
  Card,
  Descriptions,
  Input,
  Modal,
  Space,
  Tag,
} from 'antd';
import { useCallback, useMemo, useState } from 'react';
import { Can } from '@/components/authorization/Can.jsx';
import { DataTable } from '@/components/tables/DataTable.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';
import { permissions } from '@/config/permissions.js';
import { ProductForm } from '../components/ProductForm.jsx';
import { ProductImagesManager } from '../components/ProductImagesManager.jsx';
import * as api from '../products.api.js';

const initialFilters = {
  page: 1,
  pageSize: 25,
  sortBy: 'name',
  sortOrder: 'asc',
};

export function ProductListPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(initialFilters);
  const [modal, setModal] = useState(null);
  const [details, setDetails] = useState(null);
  const [imageProduct, setImageProduct] = useState(null);
  const query = useQuery({
    queryKey: ['products', 'list', filters],
    queryFn: () => api.listProducts(filters),
  });
  const create = useMutation({ mutationFn: api.createProduct });
  const update = useMutation({
    mutationFn: ({ id, data }) => api.updateProduct(id, data),
  });
  const status = useMutation({
    mutationFn: ({ product, next }) => api.changeProductStatus(product, next),
  });
  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['products'] }),
    [queryClient],
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
      message.success('Producto guardado.');
    } catch (error) {
      message.error(error.message);
    }
  }

  const columns = useMemo(
    () => [
      { title: 'Código', dataIndex: 'internalCode' },
      { title: 'SKU', dataIndex: 'sku', render: (value) => value || '—' },
      { title: 'Producto', dataIndex: 'name' },
      {
        title: 'Categoría',
        render: (_, item) => item.productCategory.parent?.name ?? '—',
      },
      { title: 'Subcategoría', render: (_, item) => item.productCategory.name },
      { title: 'Marca', render: (_, item) => item.brand?.name ?? '—' },
      {
        title: 'Conversión',
        render: (_, item) => (
          <Tag>{`1 ${item.purchaseUnit.name} → ${Number(item.purchaseToSaleFactor)} ${item.saleUnit.name}`}</Tag>
        ),
      },
      {
        title: 'Estado',
        dataIndex: 'isActive',
        render: (value) => (
          <StatusBadge status={value ? 'ACTIVE' : 'INACTIVE'} />
        ),
      },
      {
        title: 'Acciones',
        render: (_, product) => (
          <Space>
            <Can permission={permissions.productImages.read}>
              <Button
                icon={<PictureOutlined />}
                onClick={() => setImageProduct(product)}
              />
            </Can>
            <Button
              icon={<EyeOutlined />}
              onClick={() => setDetails(product)}
            />
            <Can permission={permissions.products.update}>
              <Button
                icon={<EditOutlined />}
                onClick={() => setModal(product)}
              />
            </Can>
            <Can permission={permissions.products.changeStatus}>
              <Button
                loading={status.isPending}
                onClick={async () => {
                  try {
                    await status.mutateAsync({
                      product,
                      next: !product.isActive,
                    });
                    await refresh();
                    message.success('Estado actualizado.');
                  } catch (error) {
                    message.error(error.message);
                  }
                }}
              >
                {product.isActive ? 'Desactivar' : 'Activar'}
              </Button>
            </Can>
          </Space>
        ),
      },
    ],
    [message, refresh, status],
  );

  return (
    <>
      <PageHeader
        title="Productos"
        description="Administra el catálogo comercial de la empresa y sus conversiones de compra y venta."
        extra={
          <Can permission={permissions.products.create}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModal('create')}
            >
              Nuevo producto
            </Button>
          </Can>
        }
      />
      <Card>
        <Input.Search
          allowClear
          placeholder="Buscar por nombre, SKU o código"
          style={{ maxWidth: 420, marginBottom: 16 }}
          onSearch={(search) =>
            setFilters((current) => ({
              ...current,
              page: 1,
              search: search || undefined,
            }))
          }
        />
        <DataTable
          ariaLabel="Productos"
          columns={columns}
          dataSource={query.data?.products}
          isLoading={query.isLoading}
          error={query.error}
          onRetry={query.refetch}
          pagination={query.data?.pagination ?? { ...filters, total: 0 }}
        />
      </Card>
      <Modal
        title={modal === 'create' ? 'Nuevo producto' : 'Editar producto'}
        open={Boolean(modal)}
        footer={null}
        width={900}
        onCancel={() => setModal(null)}
        destroyOnHidden
      >
        {modal ? (
          <ProductForm
            key={modal === 'create' ? 'create' : modal.id}
            initialValues={modal === 'create' ? null : modal}
            isSubmitting={create.isPending || update.isPending}
            onCancel={() => setModal(null)}
            onSubmit={submit}
          />
        ) : null}
      </Modal>
      <Modal
        title={details?.name}
        open={Boolean(details)}
        footer={null}
        onCancel={() => setDetails(null)}
      >
        {details ? (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Código interno">
              {details.internalCode}
            </Descriptions.Item>
            <Descriptions.Item label="UUID">{details.uuid}</Descriptions.Item>
            <Descriptions.Item label="SKU">
              {details.sku || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Código original">
              {details.originalCode || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Presentación">
              {details.presentation || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Tamaño">
              {details.size || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Dimensiones">
              {details.dimensions || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Descripción">
              {details.description || '—'}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>
      <Modal
        title={`Imágenes · ${imageProduct?.name ?? ''}`}
        open={Boolean(imageProduct)}
        footer={null}
        width={960}
        onCancel={() => setImageProduct(null)}
        destroyOnHidden
      >
        {imageProduct ? <ProductImagesManager product={imageProduct} /> : null}
      </Modal>
    </>
  );
}
