/**
 * Pantalla de edición de perfil de usuario
 *
 * Permite editar nombre y email. Incluye validación, manejo de cambios sin guardar
 * y feedback háptico al guardar.
 *
 * @author AntoApp Team
 */
import React from 'react';
import { Animated, ImageBackground, SafeAreaView, View } from 'react-native';
import { useEditProfileScreen } from './editProfileScreen/useEditProfileScreen';
import { EditProfileLoadingView } from './editProfileScreen/EditProfileLoadingView';
import { EditProfileHeader } from './editProfileScreen/EditProfileHeader';
import { EditProfileForm } from './editProfileScreen/EditProfileForm';
import { EditProfileSaveSuccess } from './editProfileScreen/EditProfileSaveSuccess';
import { styles } from './editProfileScreen/editProfileScreenStyles';
import { BACKGROUND_IMAGE } from './editProfileScreen/editProfileScreenConstants';

export default function EditProfileScreen({ navigation }) {
  const {
    loading,
    editing,
    setEditing,
    saving,
    saveSuccess,
    formData,
    errors,
    fadeAnim,
    handleSave,
    handleFormChange,
  } = useEditProfileScreen(navigation);

  if (loading) {
    return <EditProfileLoadingView />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={BACKGROUND_IMAGE}
        style={styles.background}
        imageStyle={styles.imageStyle}
      >
        <EditProfileHeader
          navigation={navigation}
          editing={editing}
          saving={saving}
          onSave={handleSave}
          onEdit={() => setEditing(true)}
        />
        <Animated.View
          style={[styles.content, styles.contentPaddingBottom, { opacity: fadeAnim }]}
        >
          <EditProfileForm
            formData={formData}
            errors={errors}
            editing={editing}
            onFormChange={handleFormChange}
          />
        </Animated.View>
        {saveSuccess && <EditProfileSaveSuccess />}
      </ImageBackground>
    </SafeAreaView>
  );
}
