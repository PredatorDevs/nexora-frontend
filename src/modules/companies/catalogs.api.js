import { apiClient } from '@/api/api-client.js';

const params = {
  page: 1,
  pageSize: 100,
  sortBy: 'name',
  sortOrder: 'asc',
  activeOnly: true,
};

async function list(path, extra = {}) {
  return (await apiClient.get(path, { params: { ...params, ...extra } })).data;
}

export const listCountries = () => list('/address-dictionaries/countries');
export const listDepartments = () => list('/address-dictionaries/departments');
export const listMunicipalities = (departmentId) =>
  list('/address-dictionaries/municipalities', { departmentId });
export const listDistricts = (municipalityId) =>
  list('/address-dictionaries/districts', { municipalityId });
export const listEconomicActivities = (search) =>
  list('/economic-activities', { sortBy: 'code', search: search || undefined });
