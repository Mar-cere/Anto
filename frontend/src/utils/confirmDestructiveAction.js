import { Alert } from 'react-native';

/**
 * Diálogo nativo de confirmación para acciones irreversibles (eliminar registros TCC, etc.).
 */
export function confirmDestructiveAction({
  title,
  message,
  cancelLabel,
  confirmLabel,
  onConfirm,
}) {
  if (!title || !message || typeof onConfirm !== 'function') return;

  Alert.alert(title, message, [
    { text: cancelLabel || 'Cancel', style: 'cancel' },
    {
      text: confirmLabel || 'Delete',
      style: 'destructive',
      onPress: onConfirm,
    },
  ]);
}
