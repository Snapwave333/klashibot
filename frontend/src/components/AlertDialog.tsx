import React from 'react';
import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog';
import { cn } from '../utils/cn';

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  actionLabel: string;
  cancelLabel?: string;
  onAction: () => void;
  variant?: 'danger' | 'warning';
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  actionLabel,
  cancelLabel = 'Cancel',
  onAction,
  variant = 'danger',
}: AlertDialogProps) {
  const handleAction = () => {
    onAction();
    onOpenChange(false);
  };

  return (
    <BaseAlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseAlertDialog.Portal>
        <BaseAlertDialog.Backdrop className="fixed inset-0 bg-black/50 z-50" />
        <BaseAlertDialog.Popup className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-slate-800 rounded-lg shadow-lg p-6 space-y-4">
          <div className="space-y-2">
            <BaseAlertDialog.Title className="text-lg font-semibold text-slate-100 text-balance">
              {title}
            </BaseAlertDialog.Title>
            <BaseAlertDialog.Description className="text-sm text-slate-400 text-pretty">
              {description}
            </BaseAlertDialog.Description>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <BaseAlertDialog.Close className="px-4 py-2 rounded font-semibold bg-slate-700 hover:bg-slate-600 text-slate-100 transition-colors">
              {cancelLabel}
            </BaseAlertDialog.Close>
            <button
              onClick={handleAction}
              className={cn(
                'px-4 py-2 rounded font-semibold transition-colors',
                variant === 'danger' && 'bg-red-600 hover:bg-red-700 text-white',
                variant === 'warning' && 'bg-orange-600 hover:bg-orange-700 text-white'
              )}
            >
              {actionLabel}
            </button>
          </div>
        </BaseAlertDialog.Popup>
      </BaseAlertDialog.Portal>
    </BaseAlertDialog.Root>
  );
}
