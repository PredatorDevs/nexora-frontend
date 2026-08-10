import { SearchOutlined } from '@ant-design/icons';
import { Input } from 'antd';

export function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder = 'Buscar…',
  ...props
}) {
  return (
    <Input.Search
      allowClear
      enterButton={<SearchOutlined aria-label="Buscar" />}
      onChange={(event) => onChange?.(event.target.value)}
      onSearch={onSearch}
      placeholder={placeholder}
      value={value}
      {...props}
    />
  );
}
