import {
  ApartmentOutlined,
  AppstoreOutlined,
  AuditOutlined,
  BankOutlined,
  ColumnHeightOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  FileAddOutlined,
  FileDoneOutlined,
  FileSearchOutlined,
  HistoryOutlined,
  HomeOutlined,
  IdcardOutlined,
  ImportOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  ShoppingOutlined,
  SwapOutlined,
  TagsOutlined,
  TeamOutlined,
  TrademarkOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Menu } from 'antd';
import { Link, useLocation } from 'react-router';

import { useAuthorizedNavigation } from '@/auth/useAuthorizedNavigation.js';

const icons = Object.freeze({
  audit: <AuditOutlined />,
  brands: <TrademarkOutlined />,
  branches: <ApartmentOutlined />,
  companies: <BankOutlined />,
  dashboard: <DashboardOutlined />,
  expenseTypes: <DollarOutlined />,
  home: <HomeOutlined />,
  history: <HistoryOutlined />,
  locations: <EnvironmentOutlined />,
  permissions: <SafetyCertificateOutlined />,
  productCategories: <AppstoreOutlined />,
  products: <ShoppingOutlined />,
  productUnits: <ColumnHeightOutlined />,
  purchaseOrders: <FileDoneOutlined />,
  purchaseQuotations: <FileSearchOutlined />,
  purchaseRequests: <FileAddOutlined />,
  purchases: <ImportOutlined />,
  quotationComparison: <SwapOutlined />,
  roles: <IdcardOutlined />,
  sessions: <UserOutlined />,
  suppliers: <ShopOutlined />,
  users: <TeamOutlined />,
  warehouseCategories: <TagsOutlined />,
  warehouses: <DatabaseOutlined />,
});

function toMenuItem(item) {
  return {
    key: item.key,
    icon: icons[item.icon],
    label: item.path ? <Link to={item.path}>{item.label}</Link> : item.label,
    ...(item.children ? { children: item.children.map(toMenuItem) } : {}),
  };
}

function flatten(items) {
  return items.flatMap((item) => [item, ...flatten(item.children ?? [])]);
}

export function NavigationMenu({
  mode = 'inline',
  onNavigate,
  theme = 'light',
}) {
  const location = useLocation();
  const navigation = useAuthorizedNavigation();
  const selectedItem = flatten(navigation)
    .filter((item) => item.path)
    .sort((left, right) => right.path.length - left.path.length)
    .find((item) =>
      item.path === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(`${item.path}/`) ||
          location.pathname === item.path,
    );

  return (
    <Menu
      items={navigation.map(toMenuItem)}
      mode={mode}
      onClick={onNavigate}
      selectedKeys={selectedItem ? [selectedItem.key] : []}
      theme={theme}
    />
  );
}
