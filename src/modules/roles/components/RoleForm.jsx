import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Form, Input } from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { FormActions } from '@/components/forms/FormActions.jsx';
import { applyApiValidationErrors } from '@/components/forms/form-error-utils.js';
import {
  createRoleSchema,
  updateRoleSchema,
} from '@/modules/roles/schemas/role.schemas.js';

export function RoleForm({ mode, initialValues, onSubmit, onCancel }) {
  const isCreate = mode === 'create';
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(isCreate ? createRoleSchema : updateRoleSchema),
    defaultValues: {
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
    },
  });
  async function submit(values) {
    try {
      await onSubmit(values);
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
      {field('name', 'Nombre', (props) => (
        <Input {...props} />
      ))}
      {field('description', 'Descripción', (props) => (
        <Input.TextArea {...props} rows={4} showCount maxLength={500} />
      ))}
      <FormActions
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        submitText={isCreate ? 'Crear rol' : 'Guardar cambios'}
      />
    </Form>
  );
}
