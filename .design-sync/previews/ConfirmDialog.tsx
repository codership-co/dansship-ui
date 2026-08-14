import { ConfirmDialog } from 'dansship-ui';

export function Default() {
  return (
    <ConfirmDialog
      open
      onOpenChange={() => {}}
      onConfirm={() => {}}
      title='Delete class'
      description="Are you sure you want to delete this class? This action can't be undone."
      confirmLabel='Delete'
      cancelLabel='Cancel'
      confirmVariant='destructive'
    />
  );
}
