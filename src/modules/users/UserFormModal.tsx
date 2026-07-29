import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@components/ui/Dialog';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { UserCreateSchema, UserCreateInput } from '@shared/validation';
import { useUserStore } from '@stores/useUserStore';
import { useAuthStore } from '@stores/useAuthStore';
import { UserEntity } from '@shared/types';

export interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editUser?: (UserEntity & { role_name: string }) | null;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, editUser }) => {
  const { roles, createUser, updateUser, isLoading, error } = useUserStore();
  const { user: currentUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserCreateInput>({
    resolver: zodResolver(UserCreateSchema),
    defaultValues: {
      fullName: '',
      username: '',
      password: 'User@123456',
      pin: '',
      phone: '',
      email: '',
      roleId: roles[0]?.id || '',
      notes: '',
    },
  });

  useEffect(() => {
    if (editUser) {
      reset({
        fullName: editUser.full_name,
        username: editUser.username,
        password: 'User@123456',
        pin: editUser.pin_code_hash ? '1234' : '',
        phone: editUser.phone || '',
        email: editUser.email || '',
        roleId: editUser.role_id,
        notes: editUser.notes || '',
      });
    } else {
      reset({
        fullName: '',
        username: '',
        password: 'User@123456',
        pin: '',
        phone: '',
        email: '',
        roleId: roles[0]?.id || '',
        notes: '',
      });
    }
  }, [editUser, reset, roles]);

  const onSubmit = async (data: UserCreateInput) => {
    if (!currentUser) return;

    let ok = false;
    if (editUser) {
      ok = await updateUser(
        {
          id: editUser.id,
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
          roleId: data.roleId,
          pin: data.pin,
          isActive: true,
          notes: data.notes,
        },
        currentUser.id,
      );
    } else {
      ok = await createUser(data, currentUser.id);
    }

    if (ok) onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      title={editUser ? 'Edit User Account' : 'Create New User'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <span className="text-xs text-rose-500 font-medium block">{error}</span>}

        <Input label="Full Name *" {...register('fullName')} error={errors.fullName?.message} />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Username *"
            {...register('username')}
            disabled={Boolean(editUser)}
            error={errors.username?.message}
          />
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              User Role *
            </label>
            <select
              {...register('roleId')}
              className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!editUser && (
          <Input
            label="Initial Password *"
            type="password"
            {...register('password')}
            error={errors.password?.message}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Cashier PIN (4-6 digits)"
            type="password"
            maxLength={6}
            {...register('pin')}
          />
          <Input label="Phone Number" {...register('phone')} />
        </div>

        <Input label="Email Address" type="email" {...register('email')} />
        <Input label="Notes / Comments" {...register('notes')} />

        <div className="pt-4 flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {editUser ? 'Save Changes' : 'Create User'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
