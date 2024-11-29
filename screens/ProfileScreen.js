import React, { useState } from 'react';
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

const { width, height } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Usuario',
    email: 'usuario@email.com',
    phone: '123-456-7890',
    bio: 'Aquí puedes escribir algo sobre ti...',
  });

  const [editedProfile, setEditedProfile] = useState({ ...profile });

  const handleSave = () => {
    if (!editedProfile.name.trim() || !editedProfile.email.trim()) {
      Alert.alert('Error', 'El nombre y el correo son obligatorios.');
      return;
    }
    setProfile(editedProfile);
    setIsEditing(false);
    Alert.alert('Guardado', 'Tu información ha sido actualizada.');
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

      {/* Foto de Perfil */}
      <View style={styles.profilePicContainer}>
        {isEditing && (
          <TouchableOpacity style={styles.editPicButton}>
            <Icon name="camera" size={20} color="#FFFFFF" />
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

        <View style={styles.infoRow}>
          <Icon name="information-outline" size={24} color="#1D1B70" />
          {isEditing ? (
            <TextInput
              style={[styles.input, { height: height / 8 }]}
              value={editedProfile.bio}
              onChangeText={(text) =>
                setEditedProfile((prev) => ({ ...prev, bio: text }))
              }
              placeholder="Biografía"
              multiline
            />
          ) : (
            <Text style={[styles.infoText, { fontStyle: 'italic' }]}>{profile.bio}</Text>
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
