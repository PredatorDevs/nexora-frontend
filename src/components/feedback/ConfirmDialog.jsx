import { Input, Modal, Typography } from 'antd';
import { useState } from 'react';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  danger = false,
  isConfirming = false,
  onConfirm,
  onCancel,
  confirmationPhrase,
}) {
  const [confirmation, setConfirmation] = useState('');
  function cancel() {
    setConfirmation('');
    onCancel();
  }
  async function confirm() {
    await onConfirm();
    setConfirmation('');
  }
  return (
    <Modal
      cancelButtonProps={{ disabled: isConfirming }}
      cancelText={cancelText}
      closable={!isConfirming}
      confirmLoading={isConfirming}
      destroyOnHidden
      mask={{ closable: !isConfirming }}
      okButtonProps={{
        danger,
        disabled:
          Boolean(confirmationPhrase) && confirmation !== confirmationPhrase,
      }}
      okText={confirmText}
      onCancel={cancel}
      onOk={confirm}
      open={open}
      title={title}
    >
      {description ? (
        <Typography.Paragraph>{description}</Typography.Paragraph>
      ) : null}
      {confirmationPhrase ? (
        <>
          <Typography.Paragraph type="secondary">
            Escribe <Typography.Text code>{confirmationPhrase}</Typography.Text>{' '}
            para confirmar.
          </Typography.Paragraph>
          <Input
            aria-label="Confirmación de operación"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </>
      ) : null}
    </Modal>
  );
}
