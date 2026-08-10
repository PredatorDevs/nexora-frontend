import { Checkbox, Col, Empty, Row, Space, Typography } from 'antd';

function groupPermissions(permissions) {
  return permissions.reduce((groups, permission) => {
    groups[permission.resource] ??= [];
    groups[permission.resource].push(permission);
    return groups;
  }, {});
}

export function PermissionMatrix({ permissions, value, onChange, disabled }) {
  const groups = groupPermissions(permissions);
  if (permissions.length === 0)
    return <Empty description="No hay permisos disponibles" />;
  return (
    <Checkbox.Group value={value} onChange={onChange} disabled={disabled}>
      <Row gutter={[24, 24]}>
        {Object.entries(groups).map(([resource, items]) => (
          <Col xs={24} md={12} xl={8} key={resource}>
            <Space orientation="vertical">
              <Typography.Title level={5}>{resource}</Typography.Title>
              {items.map((permission) => (
                <Checkbox key={permission.code} value={permission.code}>
                  <Space orientation="vertical" size={0}>
                    <Typography.Text code>{permission.code}</Typography.Text>
                    {permission.description ? (
                      <Typography.Text type="secondary">
                        {permission.description}
                      </Typography.Text>
                    ) : null}
                  </Space>
                </Checkbox>
              ))}
            </Space>
          </Col>
        ))}
      </Row>
    </Checkbox.Group>
  );
}
