import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AsyncStorage from '@react-native-async-storage/async-storage';


const { width, height } = Dimensions.get('window'); // Dimensiones responsivas

const LogScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null); // Manejo de errores

  // Validar formato de correo electrónico
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Manejar cambios en los campos de entrada
  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setErrorMessage(null); // Limpiar errores al escribir
  };

  // Validar y manejar el inicio de sesión
  const handleLogin = async () => {
    const { email, password } = formData;
  
    if (!email || !password) {
      setErrorMessage('Por favor, completa todos los campos.');
      return;
    }
  
    if (!validateEmail(email)) {
      setErrorMessage('Por favor, introduce un correo electrónico válido.');
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      const response = await fetch('http://localhost:5001/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
  
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error en el inicio de sesión');
      }
  
      const data = await response.json();
  
      // Manejo del token (si existe)
      if (data.token) {
        await AsyncStorage.setItem('userToken', data.token); // Guarda el token
        await AsyncStorage.setItem('userData', JSON.stringify(data.user)); // Guarda los datos del usuario
  
        // Navega al Dashboard
        navigation.replace('Dash');
      }
    } catch (error) {
      setErrorMessage(error.message || 'Error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.scrollContainer}
      extraScrollHeight={20}
      enableOnAndroid={true}
    >
      <Text style={styles.titleText}>Iniciar Sesión</Text>
      <Text style={styles.subTitleText}>Ingresa tus datos para continuar.</Text>

      {/* Mostrar mensajes de error */}
      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      {/* Campo de Correo Electrónico */}
      <TextInput
        style={styles.input}
        placeholder="Correo Electrónico"
        placeholderTextColor="#A3ADDB"
        keyboardType="email-address"
        onChangeText={(text) => handleInputChange('email', text)}
        value={formData.email}
      />

      {/* Campo de Contraseña con opción de mostrar */}
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

      {/* Botón de Inicio de Sesión */}
      <TouchableOpacity
        style={[styles.mainButton, isSubmitting && styles.disabledButton]}
        activeOpacity={0.8}
        onPress={handleLogin}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.mainButtonText}>Iniciar Sesión</Text>
        )}
      </TouchableOpacity>

      {/* Enlace para Crear Cuenta */}
      <TouchableOpacity onPress={() => navigation.navigate('SignIn')} style={styles.linkContainer}>
        <Text style={styles.linkText}>¿No tienes cuenta? Crea una ahora</Text>
      </TouchableOpacity>

      {/* Enlace para Recuperar Contraseña */}
      <TouchableOpacity onPress={() => navigation.navigate('Recover')} style={styles.linkContainer}>
        <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
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
    fontSize: width / 9, // Cercano a proporción áurea
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: height / 25, // Espaciado proporcional
    marginTop: height / 20,
  },
  subTitleText: {
    fontSize: width / 23,
    color: '#A3ADDB',
    textAlign: 'center',
    marginBottom: height / 15,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: width / 30,
    textAlign: 'center',
    marginBottom: height / 40,
  },
  input: {
    width: '100%',
    backgroundColor: '#CECFDB',
    borderRadius: 20,
    paddingVertical: height / 48, // Proporción áurea para altura
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
  mainButton: {
    backgroundColor: '#5127DB',
    paddingVertical: height / 48,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: height / 25, // Proporcionalmente espaciado
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

export default LogScreen;
