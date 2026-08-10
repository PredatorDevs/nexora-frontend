import { Alert, Col, Descriptions, Drawer, Row, Spin, Tag } from 'antd';

import { useEntityChange } from '@/modules/entity-changes/hooks/useEntityChanges.js';

const jsonStyle = {
  margin: 0,
  maxHeight: 420,
  overflow: 'auto',
  padding: 12,
  background: 'var(--ant-color-fill-quaternary)',
  borderRadius: 6,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
};

function JsonSnapshot({ value }) {
  return <pre style={jsonStyle}>{JSON.stringify(value, null, 2) ?? '—'}</pre>;
}

export function EntityChangeDetails({ changeId, open, onClose }) {
  const query = useEntityChange(changeId, open);
  const change = query.data;

  return (
    <Drawer
      destroyOnHidden
      open={open}
      onClose={onClose}
      title="Detalle del cambio"
      width={900}
    >
      {query.isLoading ? <Spin /> : null}
      {query.error ? (
        <Alert
          showIcon
          type="error"
          message="No fue posible cargar el detalle"
          description={query.error.message}
        />
      ) : null}
      {change ? (
        <>
          <Descriptions
            column={{ xs: 1, md: 2 }}
            items={[
              { key: 'id', label: 'ID', children: change.id },
              {
                key: 'operation',
                label: 'Operación',
                children: <Tag>{change.operation}</Tag>,
              },
              {
                key: 'entity',
                label: 'Entidad',
                children: `${change.schemaName}.${change.entityType} · ${change.entityId}`,
              },
              {
                key: 'actor',
                label: 'Actor',
                children: change.actorUserId ?? 'Sistema',
              },
              {
                key: 'request',
                label: 'Request ID',
                children: change.requestId,
              },
              {
                key: 'date',
                label: 'Fecha',
                children: new Intl.DateTimeFormat('es', {
                  dateStyle: 'medium',
                  timeStyle: 'medium',
                }).format(new Date(change.createdAt)),
              },
            ]}
          />
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <h3>Estado anterior</h3>
              <JsonSnapshot value={change.oldValues} />
            </Col>
            <Col xs={24} lg={12}>
              <h3>Estado nuevo</h3>
              <JsonSnapshot value={change.newValues} />
            </Col>
          </Row>
        </>
      ) : null}
    </Drawer>
  );
}
