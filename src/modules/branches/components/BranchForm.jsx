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
  const departmentId = Form.useWatch('departmentId', form);
  const municipalityId = Form.useWatch('municipalityId', form);
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
    queryKey: ['catalogs', 'districts', municipalityId],
    queryFn: () => catalogs.listDistricts(municipalityId),
    enabled: Boolean(municipalityId),
    staleTime: 300000,
  });
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ isHeadquarters: false, ...initialValues }}
      onFinish={(values) =>
        onSubmit({
          ...values,
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
            />
          </Form.Item>
        </Col>
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
        <Col xs={24} md={12}>
          <Form.Item
            name="municipalityId"
            label="Municipio"
            rules={[{ required: true }]}
          >
            <Select
              disabled={!departmentId}
              showSearch
              optionFilterProp="label"
              loading={municipalities.isLoading}
              options={municipalities.data?.map(option)}
              onChange={() => form.setFieldValue('districtId', undefined)}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="districtId"
            label="Distrito"
            rules={[{ required: true }]}
          >
            <Select
              disabled={!municipalityId}
              showSearch
              optionFilterProp="label"
              loading={districts.isLoading}
              options={districts.data?.map(option)}
            />
          </Form.Item>
        </Col>
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
