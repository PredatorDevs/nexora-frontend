import { Descriptions, Drawer, Tag, Typography } from 'antd';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';

function formatDate(value) {
  return new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));
}

export function AuditDetails({ event, open, onClose }) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Detalle del evento"
      width={620}
    >
      {event ? (
        <Descriptions
          column={1}
          items={[
            { key: 'id', label: 'ID', children: event.id },
            {
              key: 'result',
              label: 'Resultado',
              children: <StatusBadge status={event.result} />,
            },
            {
              key: 'action',
              label: 'Acción',
              children: <Tag>{event.action}</Tag>,
            },
            {
              key: 'actor',
              label: 'Actor',
              children: event.actorUserId ?? 'Anónimo o sistema',
            },
            {
              key: 'resource',
              label: 'Recurso',
              children: `${event.resourceType}${event.resourceId ? ` · ${event.resourceId}` : ''}`,
            },
            {
              key: 'request',
              label: 'Request ID',
              children: (
                <Typography.Text copyable>{event.requestId}</Typography.Text>
              ),
            },
            {
              key: 'ip',
              label: 'Dirección IP',
              children: event.ipAddress || '—',
            },
            {
              key: 'agent',
              label: 'Agente de usuario',
              children: event.userAgent || '—',
            },
            {
              key: 'created',
              label: 'Fecha',
              children: formatDate(event.createdAt),
            },
            {
              key: 'metadata',
              label: 'Metadatos sanitizados',
              children: event.metadata ? (
                <pre>{JSON.stringify(event.metadata, null, 2)}</pre>
              ) : (
                '—'
              ),
            },
          ]}
        />
      ) : null}
    </Drawer>
  );
}
