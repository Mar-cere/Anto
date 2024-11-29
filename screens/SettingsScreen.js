import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

const SettingsScreen = ({ navigation }) => {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('Español');

  const toggleNotifications = () => {
    setIsNotificationsEnabled((prev) => !prev);
    Alert.alert(
      'Notificaciones',
      `Las notificaciones han sido ${!isNotificationsEnabled ? 'activadas' : 'desactivadas'}.`
    );
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
    Alert.alert(
      'Modo Oscuro',
      `El modo oscuro ha sido ${!isDarkMode ? 'activado' : 'desactivado'}.`
    );
  };

  const handleLanguageChange = () => {
    const newLanguage = selectedLanguage === 'Español' ? 'English' : 'Español';
    setSelectedLanguage(newLanguage);
    Alert.alert('Idioma Cambiado', `El idioma ahora está configurado en ${newLanguage}.`);
  };

  const handleExportData = () => {
    Alert.alert(
      'Exportar Datos',
      'Tus datos se están exportando. Recibirás un correo cuando el proceso haya finalizado.'
    );
  };

  const handleGetPDF = () => {
    Alert.alert(
      'Descargar PDF',
      'Un archivo PDF con tus datos se está generando. Se guardará en tu dispositivo.'
    );
  };

  const handleAccountReset = () => {
    Alert.alert('Restablecer Cuenta', '¿Estás seguro de que deseas restablecer tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Restablecer',
        style: 'destructive',
        onPress: () => Alert.alert('Cuenta Restablecida', 'Todos los datos han sido eliminados.'),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuración</Text>

      <View style={styles.option}>
        <Icon name="bell-ring" size={24} color="#1D1B70" />
        <Text style={styles.optionText}>Notificaciones</Text>
        <Switch
          value={isNotificationsEnabled}
          onValueChange={toggleNotifications}
          trackColor={{ false: '#767577', true: '#4CAF50' }}
          thumbColor={isNotificationsEnabled ? '#4CAF50' : '#f4f3f4'}
        />
      </View>

      <View style={styles.option}>
        <Icon name="theme-light-dark" size={24} color="#1D1B70" />
        <Text style={styles.optionText}>Modo Oscuro</Text>
        <Switch
          value={isDarkMode}
          onValueChange={toggleDarkMode}
          trackColor={{ false: '#767577', true: '#5127DB' }}
          thumbColor={isDarkMode ? '#5127DB' : '#f4f3f4'}
        />
      </View>

      <TouchableOpacity style={styles.option} onPress={handleLanguageChange}>
        <Icon name="translate" size={24} color="#1D1B70" />
        <Text style={styles.optionText}>Idioma: {selectedLanguage}</Text>
        <Icon name="chevron-right" size={24} color="#1D1B70" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={handleGetPDF}>
        <Icon name="file-pdf-box" size={24} color="#1D1B70" />
        <Text style={styles.optionText}>Revisar mi información</Text>
        <Icon name="download" size={24} color="#1D1B70" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={handleExportData}>
        <Icon name="export" size={24} color="#1D1B70" />
        <Text style={styles.optionText}>Exportar Mis Datos</Text>
        <Icon name="chevron-right" size={24} color="#1D1B70" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('Profile')}>
        <Icon name="account-circle" size={24} color="#1D1B70" />
        <Text style={styles.optionText}>Editar Perfil</Text>
        <Icon name="chevron-right" size={24} color="#1D1B70" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={handleAccountReset}>
        <Icon name="account-off" size={24} color="#E63946" />
        <Text style={[styles.optionText, { color: '#E63946' }]}>Restablecer Cuenta</Text>
        <Icon name="chevron-right" size={24} color="#E63946" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D1B70',
    padding: width / 20,
  },
  title: {
    fontSize: width / 15,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: height / 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#CECFDB',
    borderRadius: 10,
    padding: width / 20,
    marginBottom: height / 40,
  },
  optionText: {
    fontSize: width / 25,
    color: '#1D1B70',
    flex: 1,
    marginLeft: width / 20,
  },
});

export default SettingsScreen;
