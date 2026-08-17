import { Button, Checkbox, Col, Form, Input, Row, Select, Space } from 'antd';
import { useQuery } from '@tanstack/react-query';
import * as catalogs from '@/modules/companies/catalogs.api.js';
const option = (item) => ({ value: item.id, label: item.name });
const nullable = (value) => value?.trim() || null;
export function BranchForm({
  initialValues,
  isSubmitting,
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();
  const countryId = Form.useWatch('countryId', form);
  const departmentId = Form.useWatch('departmentId', form);
  const countries = useQuery({
    queryKey: ['catalogs', 'countries'],
    queryFn: catalogs.listCountries,
    staleTime: 300000,
  });
  const departments = useQuery({
    queryKey: ['catalogs', 'departments'],
    queryFn: catalogs.listDepartments,
    staleTime: 300000,
  });
  const municipalities = useQuery({
    queryKey: ['catalogs', 'municipalities', departmentId],
    queryFn: () => catalogs.listMunicipalities(departmentId),
    enabled: Boolean(departmentId),
    staleTime: 300000,
  });
  const districts = useQuery({
    queryKey: ['catalogs', 'districts', { departmentId }],
    queryFn: () => catalogs.listDistricts({ departmentId }),
    enabled: Boolean(departmentId),
    staleTime: 300000,
  });
  const selectedCountry = countries.data?.find(({ id }) => id === countryId);
  const isElSalvador = selectedCountry?.abbreviation === 'SV';
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ isHeadquarters: false, ...initialValues }}
      onFinish={(values) =>
        onSubmit({
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
        })
      }
    >
      <Row gutter={16}>
        {!initialValues && (
          <Col xs={24} md={8}>
            <Form.Item name="code" label="Código" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
        )}
        <Col xs={24} md={16}>
          <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="isHeadquarters" valuePropName="checked">
            <Checkbox>Casa matriz</Checkbox>
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
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
        <Col xs={24} md={12}>
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
            <Col xs={24} md={12}>
              <Form.Item
                name="foreignAdministrativeArea"
                label="Estado, provincia o regiÃ³n"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
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
          <Col xs={24} md={12}>
            <Form.Item
              name="districtId"
            label="Distrito"
            rules={[{ required: true }]}
          >
            <Select
              disabled={!departmentId}
              showSearch
              optionFilterProp="label"
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
          <Col xs={24} md={12}>
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
            <Input.TextArea />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="phone" label="Teléfono">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="email" label="Correo" rules={[{ type: 'email' }]}>
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Space>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button type="primary" htmlType="submit" loading={isSubmitting}>
          Guardar sucursal
        </Button>
      </Space>
    </Form>
  );
}
