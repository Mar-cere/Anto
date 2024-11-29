import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TextInput, TouchableOpacity, Alert, ActivityIndicator, Animated } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const { width, height } = Dimensions.get('window'); // Dimensiones para diseño responsivo

const SignInScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isTermsAccepted, setTermsAccepted] = useState(false);
  const progressAnim = new Animated.Value(0); // Animación para progreso

  // Validar formato de correo electrónico
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Manejar cambios en los campos de entrada
  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  // Calcular progreso del formulario
  const calculateProgress = () => {
    const totalFields = 4;
    const completedFields = Object.values(formData).filter(Boolean).length;
    return (completedFields / totalFields) * 100;
  };

  // Animar progreso
  Animated.timing(progressAnim, {
    toValue: calculateProgress(),
    duration: 300,
    useNativeDriver: false,
  }).start();

  // Validar y manejar el registro
  const handleSignUp = () => {
    const { name, email, password, confirmPassword } = formData;

    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor, completa todos los campos.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Por favor, introduce un correo electrónico válido.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    if (!isTermsAccepted) {
      Alert.alert('Error', 'Debes aceptar los términos y condiciones.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      Alert.alert('Éxito', '¡Tu cuenta ha sido creada exitosamente!');
      setIsSubmitting(false);
      navigation.navigate('Login');
    }, 2000); // Simulación de creación de cuenta
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.scrollContainer}
      extraScrollHeight={20}
      enableOnAndroid={true}
    >
      {/* Título */}
      <Text style={styles.titleText}>Crear Cuenta</Text>
      <Text style={styles.subTitleText}>Por favor, llena los campos para registrarte.</Text>

      {/* Barra de progreso */}
      <View style={styles.progressContainer}>
        <Animated.View style={[styles.progressBar, { width: `${progressAnim.__getValue()}%` }]} />
      </View>

      {/* Campos de Entrada */}
      <TextInput
        style={styles.input}
        placeholder="Nombre"
        placeholderTextColor="#A3ADDB"
        onChangeText={(text) => handleInputChange('name', text)}
        value={formData.name}
      />
      <TextInput
        style={styles.input}
        placeholder="Correo Electrónico"
        placeholderTextColor="#A3ADDB"
        keyboardType="email-address"
        onChangeText={(text) => handleInputChange('email', text)}
        value={formData.email}
      />
      {/* Campo de contraseña con opción de mostrar */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Contraseña"
          placeholderTextColor="#A3ADDB"
          secureTextEntry={!isPasswordVisible}
          onChangeText={(text) => handleInputChange('password', text)}
          value={formData.password}
        />
        <TouchableOpacity onPress={() => setPasswordVisible(!isPasswordVisible)}>
          <Text style={styles.toggleText}>
            {isPasswordVisible ? 'Ocultar' : 'Mostrar'}
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Confirmar Contraseña"
        placeholderTextColor="#A3ADDB"
        secureTextEntry
        onChangeText={(text) => handleInputChange('confirmPassword', text)}
        value={formData.confirmPassword}
      />

      {/* Checkbox de Términos */}
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setTermsAccepted(!isTermsAccepted)}
      >
        <View style={[styles.checkbox, isTermsAccepted && styles.checkboxChecked]} />
        <Text style={styles.termsText}>
          Acepto los <Text style={styles.termsLink}>términos y condiciones</Text>.
        </Text>
      </TouchableOpacity>

      {/* Botón de Registro */}
      <TouchableOpacity
        style={[styles.mainButton, isSubmitting && styles.disabledButton]}
        activeOpacity={0.8}
        onPress={handleSignUp}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.mainButtonText}>Registrarse</Text>
        )}
      </TouchableOpacity>

      {/* Enlace para iniciar sesión */}
      <TouchableOpacity
        onPress={() => navigation.navigate('LogIn')}
        style={styles.linkContainer}
      >
        <Text style={styles.linkText}>¿Ya tienes una cuenta? Inicia Sesión</Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width / 10,
    backgroundColor: '#1D1B70',
  },
  titleText: {
    fontSize: width / 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: height / 36,
  },
  subTitleText: {
    fontSize: width / 25,
    color: '#A3ADDB',
    textAlign: 'center',
    marginBottom: height / 12,
  },
  progressContainer: {
    width: '100%',
    height: 10,
    backgroundColor: '#A3ADDB',
    borderRadius: 5,
    marginBottom: height / 40,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#5127DB',
    borderRadius: 5,
  },
  input: {
    width: '100%',
    backgroundColor: '#CECFDB',
    borderRadius: 20,
    paddingVertical: height / 50,
    paddingHorizontal: width / 20,
    fontSize: width / 25,
    marginBottom: height / 40,
    color: '#1D1B70',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CECFDB',
    borderRadius: 20,
    marginBottom: height / 40,
    width: '100%',
    paddingHorizontal: width / 20,
  },
  passwordInput: {
    flex: 1,
    color: '#1D1B70',
    fontSize: width / 25,
    paddingVertical: height / 50,
  },
  toggleText: {
    color: '#1ADDDB',
    fontWeight: 'bold',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height / 40,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#A3ADDB',
    marginRight: 10,
    borderRadius: 5,
  },
  checkboxChecked: {
    backgroundColor: '#5127DB',
  },
  termsText: {
    fontSize: width / 30,
    color: '#A3ADDB',
  },
  termsLink: {
    color: '#1ADDDB',
    fontWeight: 'bold',
  },
  mainButton: {
    backgroundColor: '#5127DB',
    paddingVertical: height / 52,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: height / 30,
  },
  disabledButton: {
    backgroundColor: '#7F8C8D',
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: width / 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  linkContainer: {
    marginTop: height / 40,
  },
  linkText: {
    fontSize: width / 25,
    color: '#1ADDDB',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SignInScreen;
