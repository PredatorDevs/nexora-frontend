import { Descriptions, Drawer, Tag, Typography } from 'antd';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';
import { getSessionStatus } from '@/modules/sessions/schemas/session.schemas.js';

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));
}

export function SessionDetails({ session, open, onClose }) {
  return (
    <Drawer open={open} onClose={onClose} title="Detalle de sesión" width={560}>
      {session ? (
        <Descriptions
          column={1}
          items={[
            {
              key: 'status',
              label: 'Estado',
              children: <StatusBadge status={getSessionStatus(session)} />,
            },
            {
              key: 'user',
              label: 'Usuario',
              children: `${session.user.displayName} (${session.user.email})`,
            },
            {
              key: 'id',
              label: 'ID de sesión',
              children: (
                <Typography.Text copyable>{session.id}</Typography.Text>
              ),
            },
            {
              key: 'family',
              label: 'Familia',
              children: (
                <Typography.Text copyable>{session.familyId}</Typography.Text>
              ),
            },
            {
              key: 'ip',
              label: 'Dirección IP',
              children: session.ipAddress || '—',
            },
            {
              key: 'agent',
              label: 'Agente de usuario',
              children: session.userAgent || '—',
            },
            {
              key: 'created',
              label: 'Creada',
              children: formatDate(session.createdAt),
            },
            {
              key: 'used',
              label: 'Último uso',
              children: formatDate(session.lastUsedAt),
            },
            {
              key: 'expires',
              label: 'Expira',
              children: formatDate(session.expiresAt),
            },
            {
              key: 'revoked',
              label: 'Revocada',
              children: formatDate(session.revokedAt),
            },
            {
              key: 'reason',
              label: 'Motivo de revocación',
              children: session.revokedReason ? (
                <Tag>{session.revokedReason}</Tag>
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
