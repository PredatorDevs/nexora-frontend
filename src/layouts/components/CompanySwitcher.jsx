import { BankOutlined } from '@ant-design/icons';
import { App, Select } from 'antd';
import { useState } from 'react';

import { useAuth } from '@/auth/useAuth.js';

export function CompanySwitcher() {
  const { memberships, activeMembership, switchCompany } = useAuth();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  if (!memberships.length) return null;

  async function change(companyId) {
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
      value={activeMembership?.companyId}
      placeholder="Seleccionar empresa"
      loading={loading}
      onChange={change}
      suffixIcon={<BankOutlined />}
      style={{ minWidth: 220 }}
      options={memberships.map(({ company }) => ({
        value: company.id,
        label: company.commercialName || company.legalName,
      }))}
    />
  );
}
