import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const PasswordRecoveryScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSend = () => {
    if (!validateEmail(email)) {
      Alert.alert('Error', 'Por favor, introduce un correo electrónico válido.');
      return;
    }
    // Simulación de envío
    setIsSent(true);
    setTimeout(() => {
      Alert.alert('Éxito', 'Se ha enviado un enlace de recuperación a tu correo.');
      setIsSent(false);
      navigation.goBack(); // Regresa a la pantalla anterior
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar Contraseña</Text>

      <Text style={styles.instructions}>
        Introduce tu correo electrónico y te enviaremos un enlace para recuperar tu contraseña.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#A3ADDB"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[styles.button, isSent && styles.buttonDisabled]}
        onPress={handleSend}
        disabled={isSent}
      >
        <Text style={styles.buttonText}>{isSent ? 'Enviando...' : 'Enviar Enlace'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D1B70',
    paddingHorizontal: width / 20,
    paddingTop: height / 10,
  },
  title: {
    fontSize: width / 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: height / 30,
    textAlign: 'center',
  },
  instructions: {
    fontSize: width / 25,
    color: '#A3ADDB',
    marginBottom: height / 40,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#CECFDB',
    color: '#1D1B70',
    borderRadius: 10,
    padding: width / 30,
    fontSize: width / 25,
    marginBottom: height / 40,
  },
  button: {
    backgroundColor: '#5127DB',
    borderRadius: 10,
    paddingVertical: height / 80,
    alignItems: 'center',
    marginBottom: height / 50,
  },
  buttonDisabled: {
    backgroundColor: '#A3ADDB',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: width / 25,
  },
  backButton: {
    alignSelf: 'center',
    marginTop: height / 60,
  },
  backButtonText: {
    color: '#1ADDDB',
    fontSize: width / 28,
    textDecorationLine: 'underline',
  },
});

export default PasswordRecoveryScreen;
