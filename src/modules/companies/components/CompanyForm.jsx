import { Alert, Button, Col, Form, Input, Row, Select, Space } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import * as catalogs from '@/modules/companies/catalogs.api.js';

const option = (item) => ({
  value: item.id,
  label: item.code ? `${item.code} — ${item.name}` : item.name,
});
const nullable = (value) => value?.trim() || null;

export function CompanyForm({
  initialValues,
  isSubmitting,
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();
  const [activitySearch, setActivitySearch] = useState('');
  const countryId = Form.useWatch('countryId', form);
  const departmentId = Form.useWatch('departmentId', form);
  const countries = useQuery({
    queryKey: ['catalogs', 'countries'],
    queryFn: catalogs.listCountries,
    staleTime: 300_000,
  });
  const departments = useQuery({
    queryKey: ['catalogs', 'departments'],
    queryFn: catalogs.listDepartments,
    staleTime: 300_000,
  });
  const municipalities = useQuery({
    queryKey: ['catalogs', 'municipalities', departmentId],
    queryFn: () => catalogs.listMunicipalities(departmentId),
    enabled: Boolean(departmentId),
    staleTime: 300_000,
  });
  const districts = useQuery({
    queryKey: ['catalogs', 'districts', { departmentId }],
    queryFn: () => catalogs.listDistricts({ departmentId }),
    enabled: Boolean(departmentId),
    staleTime: 300_000,
  });
  const activities = useQuery({
    queryKey: ['catalogs', 'economic-activities', activitySearch],
    queryFn: () => catalogs.listEconomicActivities(activitySearch),
    staleTime: 60_000,
  });
  const selectedCountry = countries.data?.find(({ id }) => id === countryId);
  const isElSalvador = selectedCountry?.abbreviation === 'SV';
  const catalogError = countries.error ?? departments.error ?? activities.error;

  function retryCatalogs() {
    void countries.refetch();
    void departments.refetch();
    void activities.refetch();
  }

  async function submit(values) {
    const activityTypes = ['PRIMARY', 'SECONDARY', 'TERTIARY'];
    await onSubmit({
      ...values,
      departmentId: isElSalvador ? values.departmentId : null,
      municipalityId: isElSalvador ? values.municipalityId : null,
      districtId: isElSalvador ? values.districtId : null,
      foreignAdministrativeArea: isElSalvador
        ? null
        : nullable(values.foreignAdministrativeArea),
      foreignLocality: isElSalvador
        ? null
        : nullable(values.foreignLocality),
      phone: nullable(values.phone),
      email: nullable(values.email),
      website: nullable(values.website),
      logoStorageKey: nullable(values.logoStorageKey),
      defaultCurrencyCode: values.defaultCurrencyCode || 'USD',
      timezone: values.timezone || 'America/El_Salvador',
      locale: values.locale || 'es-SV',
      economicActivities: values.economicActivityIds.map((id, index) => ({
        economicActivityId: id,
        type: activityTypes[index],
      })),
    });
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={submit}
      initialValues={{
        defaultCurrencyCode: 'USD',
        timezone: 'America/El_Salvador',
        locale: 'es-SV',
        economicActivityIds: [],
        ...initialValues,
      }}
    >
      {catalogError ? (
        <Alert
          type="error"
          showIcon
          title="No fue posible cargar los catálogos"
          description={catalogError.message}
          action={<Button onClick={retryCatalogs}>Reintentar</Button>}
          style={{ marginBottom: 16 }}
        />
      ) : null}
      <Row gutter={16}>
        {!initialValues && (
          <Col xs={24} md={8}>
            <Form.Item name="code" label="Código" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
        )}
        <Col xs={24} md={8}>
          <Form.Item
            name="legalName"
            label="Razón social"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name="commercialName"
            label="Nombre comercial"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="nit" label="NIT" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="nrc" label="NRC" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="countryId" label="País" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              loading={countries.isLoading}
              options={countries.data?.map(option)}
              onChange={() =>
                form.setFieldsValue({
                  departmentId: undefined,
                  municipalityId: undefined,
                  districtId: undefined,
                  foreignAdministrativeArea: undefined,
                  foreignLocality: undefined,
                })
              }
            />
          </Form.Item>
        </Col>
        {isElSalvador ? (
          <>
        <Col xs={24} md={8}>
          <Form.Item
            name="departmentId"
            label="Departamento"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              loading={departments.isLoading}
              options={departments.data?.map(option)}
              onChange={() =>
                form.setFieldsValue({
                  municipalityId: undefined,
                  districtId: undefined,
                })
              }
            />
          </Form.Item>
        </Col>
          </>
        ) : countryId ? (
          <>
            <Col xs={24} md={8}>
              <Form.Item
                name="foreignAdministrativeArea"
                label="Estado, provincia o región"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="foreignLocality"
                label="Ciudad o localidad"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </>
        ) : null}
        {isElSalvador ? (
          <Col xs={24} md={8}>
            <Form.Item
              name="districtId"
            label="Distrito"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              disabled={!departmentId}
              loading={districts.isLoading}
              options={districts.data?.map(option)}
              onChange={(districtId) => {
                const district = districts.data?.find(
                  ({ id }) => id === districtId,
                );
                form.setFieldValue('municipalityId', district?.municipalityId);
              }}
            />
            </Form.Item>
          </Col>
        ) : null}
        {isElSalvador ? (
          <Col xs={24} md={8}>
            <Form.Item
              name="municipalityId"
              label="Municipio (asignado por el distrito)"
              rules={[{ required: true }]}
            >
              <Select
                disabled
                loading={municipalities.isLoading}
                options={municipalities.data?.map(option)}
              />
            </Form.Item>
          </Col>
        ) : null}
        <Col span={24}>
          <Form.Item
            name="addressLine"
            label="Dirección"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={2} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="phone" label="Teléfono">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="email" label="Correo" rules={[{ type: 'email' }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="website" label="Sitio web" rules={[{ type: 'url' }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item
            name="economicActivityIds"
            label="Actividades económicas (principal primero)"
            rules={[{ required: true, type: 'array', min: 1, max: 3 }]}
          >
            <Select
              mode="multiple"
              maxCount={3}
              showSearch
              filterOption={false}
              onSearch={setActivitySearch}
              loading={activities.isLoading}
              options={activities.data?.map(option)}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="defaultCurrencyCode" label="Moneda">
            <Input maxLength={3} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="timezone" label="Zona horaria">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="locale" label="Configuración regional">
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Space>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button type="primary" htmlType="submit" loading={isSubmitting}>
          Guardar empresa
        </Button>
      </Space>
    </Form>
  );
}
