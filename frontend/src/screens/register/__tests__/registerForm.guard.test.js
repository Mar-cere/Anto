/**
 * Guardrails del formulario de registro — campos de contraseña accesibles en web y móvil.
 */
import fs from 'fs';
import path from 'path';

const FRONTEND_SRC = path.resolve(__dirname, '..', '..', '..');

function readSrc(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_SRC, relativePath), 'utf8');
}

describe('registerForm guard', () => {
  it('RegisterForm blinda contraseñas con autocomplete y sync web', () => {
    const src = readSrc('screens/register/RegisterForm.js');
    expect(src).toMatch(/testID="register-password-input"/);
    expect(src).toMatch(/ref=\{passwordRef\}/);
    expect(src).toMatch(/ref=\{confirmPasswordRef\}/);
    expect(src).toMatch(/getAuthPasswordAutoComplete\('register-password'\)/);
    expect(src).toMatch(/getAuthPasswordAutoComplete\('register-confirm-password'\)/);
    expect(src).toMatch(/syncWebTextInputOnBlur/);
    expect(src).toMatch(/syncWebTextInputOnFocus/);
    expect(src).toMatch(/createAuthTextChangeHandler/);
    expect(src).toMatch(/withWebAutofillInputStyle/);
    expect(src).toMatch(/autoComplete="email"/);
  });

  it('RegisterScreen usa scroll con teclado persistente', () => {
    const src = readSrc('screens/RegisterScreen.js');
    expect(src).toMatch(/getAuthKeyboardScrollProps/);
  });

  it('useRegisterScreen actualiza estado con setters funcionales', () => {
    const src = readSrc('screens/register/useRegisterScreen.js');
    expect(src).toMatch(/setFormData\(\(prev\)/);
    expect(src).toMatch(/deriveRegisterInputErrors/);
    expect(src).toMatch(/mergeWebPasswordFields/);
    expect(src).toMatch(/validateForm\(submissionData\)/);
  });

  it('ParticleBackground no intercepta toques', () => {
    const src = readSrc('components/ParticleBackground.js');
    expect(src).toMatch(/pointerEvents="none"/);
  });
});
