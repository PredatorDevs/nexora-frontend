import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Checkbox, Form, Input } from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { FormActions } from '@/components/forms/FormActions.jsx';
import { applyApiValidationErrors } from '@/components/forms/form-error-utils.js';
import {
  createUserSchema,
  updateUserSchema,
} from '@/modules/users/schemas/user.schemas.js';

export function UserForm({ mode, initialValues, onSubmit, onCancel }) {
  const isCreate = mode === 'create';
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(isCreate ? createUserSchema : updateUserSchema),
    defaultValues: {
      displayName: initialValues?.displayName ?? '',
      email: initialValues?.email ?? '',
      ...(isCreate
        ? { password: '', confirmPassword: '', mustChangePassword: true }
        : {}),
    },
  });
  async function submit(values) {
    try {
      const payload = { ...values };
      delete payload.confirmPassword;
      await onSubmit(payload);
    } catch (error) {
      if (!applyApiValidationErrors(error, setError))
        setError('root', { message: error.message });
    }
  }
  const field = (name, label, input) => (
    <Controller
      name={name}
      control={control}
      render={({ field: props }) => (
        <Form.Item
          htmlFor={name}
          label={label}
          validateStatus={errors[name] ? 'error' : undefined}
          help={errors[name]?.message}
        >
          {input({ ...props, id: name })}
        </Form.Item>
      )}
    />
  );
  return (
    <Form
      layout="vertical"
      onFinish={handleSubmit(submit)}
      requiredMark={false}
    >
      {errors.root ? (
        <Alert type="error" showIcon title={errors.root.message} />
      ) : null}
      {field('displayName', 'Nombre', (props) => (
        <Input {...props} autoComplete="name" />
      ))}
      {field('email', 'Correo electrónico', (props) => (
        <Input {...props} autoComplete="email" />
      ))}
      {isCreate ? (
        <>
          {field('password', 'Contraseña temporal', (props) => (
            <Input.Password {...props} autoComplete="new-password" />
          ))}
          {field('confirmPassword', 'Confirmar contraseña', (props) => (
            <Input.Password {...props} autoComplete="new-password" />
          ))}
          <Controller
            name="mustChangePassword"
            control={control}
            render={({ field: props }) => (
              <Checkbox
                checked={props.value}
                onChange={(event) => props.onChange(event.target.checked)}
              >
                Exigir cambio de contraseña en el próximo acceso
              </Checkbox>
            )}
          />
        </>
      ) : null}
      <FormActions
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        submitText={isCreate ? 'Crear usuario' : 'Guardar cambios'}
      />
    </Form>
  );
}
