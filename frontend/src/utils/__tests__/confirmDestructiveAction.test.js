import { Alert } from 'react-native';
import { confirmDestructiveAction } from '../confirmDestructiveAction';

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
}));

describe('confirmDestructiveAction', () => {
  beforeEach(() => {
    Alert.alert.mockClear();
  });

  it('muestra diálogo con acciones cancelar y confirmar', () => {
    const onConfirm = jest.fn();
    confirmDestructiveAction({
      title: 'Eliminar',
      message: '¿Continuar?',
      cancelLabel: 'Cancelar',
      confirmLabel: 'Eliminar',
      onConfirm,
    });

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    const [, , buttons] = Alert.alert.mock.calls[0];
    expect(buttons).toHaveLength(2);
    expect(buttons[0].style).toBe('cancel');
    expect(buttons[1].style).toBe('destructive');
    buttons[1].onPress();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('no muestra diálogo si falta onConfirm', () => {
    confirmDestructiveAction({
      title: 'Eliminar',
      message: '¿Continuar?',
    });
    expect(Alert.alert).not.toHaveBeenCalled();
  });
});
