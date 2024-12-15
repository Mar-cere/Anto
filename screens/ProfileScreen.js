import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [editedProfile, setEditedProfile] = useState({ ...profile });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch('http://localhost:5001/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener perfil');
      }

      const userData = await response.json();
      setProfile(userData);
      setEditedProfile(userData);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudo cargar la información del perfil');
    }
  };

  const handleSave = async () => {
    if (!editedProfile.name.trim() || !editedProfile.email.trim()) {
      Alert.alert('Error', 'El nombre y el correo son obligatorios.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch('http://localhost:5001/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedProfile)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar perfil');
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setIsEditing(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        {!isEditing && (
          <TouchableOpacity
            onPress={() => setIsEditing(true)}
            style={styles.editButton}
          >
            <Icon name="pencil" size={24} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Información del Perfil */}
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Icon name="account" size={24} color="#1D1B70" />
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={editedProfile.name}
              onChangeText={(text) =>
                setEditedProfile((prev) => ({ ...prev, name: text }))
              }
              placeholder="Nombre"
            />
          ) : (
            <Text style={styles.infoText}>{profile.name}</Text>
          )}
        </View>

        <View style={styles.infoRow}>
          <Icon name="email" size={24} color="#1D1B70" />
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={editedProfile.email}
              onChangeText={(text) =>
                setEditedProfile((prev) => ({ ...prev, email: text }))
              }
              placeholder="Correo Electrónico"
              keyboardType="email-address"
            />
          ) : (
            <Text style={styles.infoText}>{profile.email}</Text>
          )}
        </View>

        <View style={styles.infoRow}>
          <Icon name="phone" size={24} color="#1D1B70" />
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={editedProfile.phone}
              onChangeText={(text) =>
                setEditedProfile((prev) => ({ ...prev, phone: text }))
              }
              placeholder="Teléfono"
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.infoText}>{profile.phone}</Text>
          )}
        </View>
      </View>

      {/* Botones de Guardar y Cerrar Sesión */}
      {isEditing ? (
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Icon name="content-save" size={24} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Guardar</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => Alert.alert('Cerrar Sesión', '¿Estás seguro?', [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Cerrar Sesión',
              style: 'destructive',
              onPress: () => navigation.navigate('Login'),
            },
          ])}
        >
          <Icon name="logout" size={24} color="#FFFFFF" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D1B70',
    padding: width / 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height / 30,
  },
  headerTitle: {
    fontSize: width / 15,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5127DB',
    borderRadius: 10,
    padding: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: width / 30,
    marginLeft: 5,
  },
  profilePicContainer: {
    alignItems: 'center',
    marginBottom: height / 20,
  },
  profilePic: {
    width: width / 4,
    height: width / 4,
    borderRadius: width / 8,
    backgroundColor: '#A3ADDB',
  },
  editPicButton: {
    position: 'absolute',
    bottom: 0,
    right: width / 8 - 20,
    backgroundColor: '#5127DB',
    padding: 8,
    borderRadius: 20,
  },
  infoContainer: {
    backgroundColor: '#CECFDB',
    borderRadius: 15,
    padding: width / 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height / 40,
  },
  input: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#1D1B70',
    marginLeft: 10,
    color: '#1D1B70',
  },
  infoText: {
    flex: 1,
    fontSize: width / 25,
    color: '#1D1B70',
    marginLeft: 10,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    paddingVertical: height / 50,
    marginTop: height / 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: width / 25,
    marginLeft: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E63946',
    borderRadius: 15,
    paddingVertical: height / 50,
    marginTop: height / 20,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: width / 25,
    marginLeft: 10,
  },
});

export default ProfileScreen;
