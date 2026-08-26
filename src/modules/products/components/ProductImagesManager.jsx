import { InboxOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Col, Empty, Form, Input, Modal, Row, Upload } from 'antd';
import { useState } from 'react';
import { Can } from '@/components/authorization/Can.jsx';
import { permissions } from '@/config/permissions.js';
import { ProductImageCard } from './ProductImageCard.jsx';
import * as api from '../product-images.api.js';

const supportedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function ProductImagesManager({ product }) {
  const { message, modal: dialog } = App.useApp();
  const client = useQueryClient();
  const [editing, setEditing] = useState(null);
  const queryKey = ['products', product.id, 'images'];
  const images = useQuery({
    queryKey,
    queryFn: () => api.listProductImages(product.id),
  });
  const refresh = async () => {
    await client.invalidateQueries({ queryKey });
    await client.invalidateQueries({ queryKey: ['products', 'list'] });
  };
  const upload = useMutation({
    mutationFn: async (file) => {
      if (!supportedTypes.has(file.type))
        throw new Error('Solo se permiten imágenes JPEG, PNG o WebP.');
      const prepared = await api.prepareProductImageUpload(file);
      await api.uploadToStorage(file, prepared);
      return api.attachProductImage(product.id, {
        storageKey: prepared.storageKey,
        altText: product.name,
      });
    },
  });
  const update = useMutation({
    mutationFn: ({ image, data }) =>
      api.updateProductImage(product.id, image.id, {
        ...data,
        expectedUpdatedAt: image.updatedAt,
      }),
  });
  const primary = useMutation({
    mutationFn: (image) => api.setPrimaryProductImage(product.id, image),
  });
  const reorder = useMutation({
    mutationFn: (ids) => api.reorderProductImages(product.id, ids),
  });
  const remove = useMutation({
    mutationFn: (image) => api.deleteProductImage(product.id, image),
  });
  const rows = images.data ?? [];
  const busy =
    upload.isPending ||
    update.isPending ||
    primary.isPending ||
    reorder.isPending ||
    remove.isPending;

  async function run(operation, success) {
    try {
      await operation();
      await refresh();
      message.success(success);
    } catch (error) {
      message.error(error.message);
    }
  }

  async function move(from, to) {
    const ordered = [...rows];
    const [item] = ordered.splice(from, 1);
    ordered.splice(to, 0, item);
    await run(
      () => reorder.mutateAsync(ordered.map((image) => image.id)),
      'Orden actualizado.',
    );
  }

  return (
    <>
      <Can permission={permissions.productImages.create}>
        <Upload.Dragger
          accept="image/jpeg,image/png,image/webp"
          multiple={false}
          showUploadList={false}
          disabled={busy || rows.length >= 10}
          customRequest={async ({ file, onSuccess, onError }) => {
            try {
              await upload.mutateAsync(file);
              await refresh();
              message.success('Imagen agregada.');
              onSuccess?.({});
            } catch (error) {
              message.error(error.message);
              onError?.(error);
            }
          }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p>Arrastra una imagen o haz clic para seleccionarla</p>
          <p>JPEG, PNG o WebP. Máximo 10 imágenes por producto.</p>
        </Upload.Dragger>
      </Can>
      {rows.length ? (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          {rows.map((image, index) => (
            <Col xs={24} sm={12} lg={8} key={image.id}>
              <ProductImageCard
                image={image}
                index={index}
                total={rows.length}
                busy={busy}
                onEdit={() => setEditing(image)}
                onPrimary={() =>
                  run(
                    () => primary.mutateAsync(image),
                    'Imagen principal actualizada.',
                  )
                }
                onMove={move}
                onDelete={() =>
                  dialog.confirm({
                    title: 'Eliminar imagen',
                    content:
                      'La imagen se desvinculará del producto y se eliminará de S3.',
                    okText: 'Eliminar',
                    okButtonProps: { danger: true },
                    onOk: () =>
                      run(() => remove.mutateAsync(image), 'Imagen eliminada.'),
                  })
                }
              />
            </Col>
          ))}
        </Row>
      ) : (
        <Empty
          style={{ marginTop: 24 }}
          description={
            images.isLoading
              ? 'Cargando imágenes…'
              : 'Este producto todavía no tiene imágenes.'
          }
        />
      )}
      <Modal
        title="Editar información de imagen"
        open={Boolean(editing)}
        footer={null}
        onCancel={() => setEditing(null)}
        destroyOnHidden
      >
        {editing ? (
          <Form
            layout="vertical"
            initialValues={editing}
            onFinish={async (values) => {
              await run(
                () =>
                  update.mutateAsync({
                    image: editing,
                    data: {
                      altText: values.altText?.trim() || null,
                      caption: values.caption?.trim() || null,
                    },
                  }),
                'Imagen actualizada.',
              );
              setEditing(null);
            }}
          >
            <Form.Item name="altText" label="Texto alternativo">
              <Input maxLength={191} />
            </Form.Item>
            <Form.Item name="caption" label="Descripción">
              <Input.TextArea rows={3} maxLength={500} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={update.isPending}>
              Guardar
            </Button>
          </Form>
        ) : null}
      </Modal>
    </>
  );
}
