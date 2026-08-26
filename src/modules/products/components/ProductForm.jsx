import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
} from 'antd';
import { useState } from 'react';
import {
  brandsApi,
  productCategoriesApi,
} from '@/modules/product-dictionaries/product-dictionaries.api.js';
import { listProductUnits } from '@/modules/product-units/product-units.api.js';

const listParams = {
  page: 1,
  pageSize: 100,
  sortBy: 'name',
  sortOrder: 'asc',
  isActive: true,
};
const nullable = (value) => value?.trim() || null;

export function ProductForm({
  initialValues,
  isSubmitting,
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();
  const initialCategoryId = initialValues?.productCategory?.parent?.id;
  const [categoryId, setCategoryId] = useState(initialCategoryId ?? null);
  const categories = useQuery({
    queryKey: ['product-categories', 'product-options', 'roots'],
    queryFn: () => productCategoriesApi.list({ ...listParams, rootOnly: true }),
  });
  const subcategories = useQuery({
    queryKey: ['product-categories', 'product-options', 'children', categoryId],
    queryFn: () =>
      productCategoriesApi.list({ ...listParams, parentId: categoryId }),
    enabled: Boolean(categoryId),
  });
  const brands = useQuery({
    queryKey: ['brands', 'product-options'],
    queryFn: () => brandsApi.list(listParams),
  });
  const purchaseUnits = useQuery({
    queryKey: ['product-units', 'product-options', 'PURCHASE'],
    queryFn: () => listProductUnits({ ...listParams, type: 'PURCHASE' }),
  });
  const saleUnits = useQuery({
    queryKey: ['product-units', 'product-options', 'SALE'],
    queryFn: () => listProductUnits({ ...listParams, type: 'SALE' }),
  });
  const hasCatalogError = [
    categories,
    subcategories,
    brands,
    purchaseUnits,
    saleUnits,
  ].some((query) => query.isError);
  const option = (value) => ({
    value: value.id,
    label: `${value.code} · ${value.name}`,
  });

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={
        initialValues
          ? { ...initialValues, categoryId: initialCategoryId }
          : { purchaseToSaleFactor: 1 }
      }
      onFinish={(values) => {
        const data = { ...values };
        delete data.categoryId;
        onSubmit({
          ...data,
          brandId: data.brandId ?? null,
          sku: nullable(data.sku),
          originalCode: nullable(data.originalCode),
          size: nullable(data.size),
          dimensions: nullable(data.dimensions),
          description: nullable(data.description),
          presentation: nullable(data.presentation),
        });
      }}
    >
      {hasCatalogError ? (
        <Alert
          type="error"
          showIcon
          message="No fue posible cargar uno o más catálogos auxiliares."
        />
      ) : null}
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="name"
            label="Nombre"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input maxLength={191} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="sku"
            label="SKU"
            extra="Opcional; debe ser único dentro de la empresa."
          >
            <Input maxLength={100} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="categoryId"
            label="Categoría"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              loading={categories.isLoading}
              options={(categories.data?.productCategories ?? []).map(option)}
              onChange={(value) => setCategoryId(value)}
              onSelect={(value) => {
                if (value !== categoryId)
                  form.setFieldValue('productCategoryId', undefined);
              }}
              placeholder="Selecciona la categoría principal"
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="productCategoryId"
            label="Subcategoría"
            rules={[{ required: true }]}
            dependencies={['categoryId']}
          >
            <Select
              showSearch
              optionFilterProp="label"
              disabled={!categoryId}
              loading={subcategories.isLoading}
              options={(subcategories.data?.productCategories ?? []).map(
                option,
              )}
              placeholder="Selecciona una subcategoría"
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="brandId" label="Marca">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              loading={brands.isLoading}
              options={(brands.data?.brands ?? []).map(option)}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="originalCode"
            label="Código original o del fabricante"
          >
            <Input maxLength={120} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="purchaseUnitId"
            label="Unidad de compra"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              loading={purchaseUnits.isLoading}
              options={(purchaseUnits.data?.productUnits ?? []).map(option)}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="saleUnitId"
            label="Unidad de venta"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              loading={saleUnits.isLoading}
              options={(saleUnits.data?.productUnits ?? []).map(option)}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="purchaseToSaleFactor"
            label="Unidades de venta por unidad de compra"
            extra="Ejemplo: una caja comprada contiene 24 unidades vendibles."
            rules={[{ required: true }, { type: 'number', min: 0.000001 }]}
          >
            <InputNumber
              min={0.000001}
              precision={6}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="presentation" label="Presentación">
            <Input maxLength={191} placeholder="Ej. Botella de 500 ml" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="size" label="Tamaño">
            <Input maxLength={120} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="dimensions" label="Dimensiones">
            <Input maxLength={191} placeholder="Ej. 20 × 10 × 8 cm" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="description" label="Descripción">
        <Input.TextArea rows={3} maxLength={5000} showCount />
      </Form.Item>
      <Space>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button type="primary" htmlType="submit" loading={isSubmitting}>
          Guardar producto
        </Button>
      </Space>
    </Form>
  );
}
