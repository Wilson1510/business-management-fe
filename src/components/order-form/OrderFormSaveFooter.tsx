import { FormActionButton } from '../FormActionButton';

export type OrderFormSaveFooterProps = {
  saving: boolean;
  mode?: 'order' | 'shipment';
};

export function OrderFormSaveFooter({ saving, mode = 'order' }: OrderFormSaveFooterProps) {
  return (
    <div
      className={`flex justify-end pt-4 ${mode === 'order' ? 'border-t border-gray-100 dark:border-gray-700' : ''}`}
    >
      <FormActionButton variant="primary" text="Save" disabled={saving} />
    </div>
  );
}
