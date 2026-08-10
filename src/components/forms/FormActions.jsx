import { Button, Space } from 'antd';

import styles from '@/components/shared.module.css';

export function FormActions({
  submitText = 'Guardar',
  cancelText = 'Cancelar',
  isSubmitting = false,
  disableSubmit = false,
  onCancel,
}) {
  return (
    <Space className={styles.formActions} wrap>
      <Button
        htmlType="submit"
        loading={isSubmitting}
        disabled={disableSubmit}
        type="primary"
      >
        {submitText}
      </Button>
      {onCancel ? (
        <Button disabled={isSubmitting} onClick={onCancel}>
          {cancelText}
        </Button>
      ) : null}
    </Space>
  );
}
