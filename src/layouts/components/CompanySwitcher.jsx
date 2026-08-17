import { BankOutlined } from '@ant-design/icons';
import { App, Select } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { useAuth } from '@/auth/useAuth.js';
import { routes } from '@/app/routes.js';

const PLATFORM_CONTEXT = 'platform';

export function CompanySwitcher() {
  const {
    memberships = [],
    activeMembership = null,
    platformPermissions = [],
    switchCompany,
    switchPlatform,
  } = useAuth();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const hasPlatformAccess = platformPermissions.length > 0;
  if (!memberships.length && !hasPlatformAccess) return null;

  async function change(companyId) {
    if (companyId === PLATFORM_CONTEXT) {
      if (!activeMembership) return;
      setLoading(true);
      try {
        await switchPlatform();
        navigate(routes.companies, { replace: true });
        message.success('AdministraciÃ³n de plataforma activa.');
      } catch (error) {
        message.error(error.message);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (companyId === activeMembership?.companyId) return;
    setLoading(true);
    try {
      await switchCompany(companyId);
      message.success('Empresa activa actualizada.');
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Select
      aria-label="Empresa activa"
      value={activeMembership?.companyId ?? PLATFORM_CONTEXT}
      placeholder="Seleccionar empresa"
      loading={loading}
      onChange={change}
      suffixIcon={<BankOutlined />}
      style={{ minWidth: 220 }}
      options={[
        ...(hasPlatformAccess
          ? [
              {
                value: PLATFORM_CONTEXT,
                label: 'AdministraciÃ³n de plataforma',
              },
            ]
          : []),
        ...memberships.map(({ company }) => ({
          value: company.id,
          label: company.commercialName || company.legalName,
        })),
      ]}
    />
  );
}
