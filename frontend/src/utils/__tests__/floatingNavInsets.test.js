import {
  getFloatingNavDockBottom,
  getFloatingNavScrollBottomInset,
} from '../floatingNavInsets';

describe('floatingNavInsets', () => {
  it('calcula dockBottom alineado con FloatingNavBar en iPhone', () => {
    expect(getFloatingNavDockBottom(34)).toBe(10);
  });

  it('reserva espacio para barra, botón central y respiro', () => {
    expect(getFloatingNavScrollBottomInset(34)).toBe(166);
  });

  it('usa mínimo de dock cuando el inset es 0', () => {
    expect(getFloatingNavDockBottom(0)).toBe(8);
    expect(getFloatingNavScrollBottomInset(0)).toBe(138);
  });
});
