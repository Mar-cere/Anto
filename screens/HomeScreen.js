import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, StatusBar, ImageBackground, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';

const { width, height } = Dimensions.get('window'); // Obtener las dimensiones de la pantalla para el diseño responsivo

const HomeScreen = ({ navigation }) => {
  // Declaración de variables de estado y referencias
  const fadeAnim = useRef(new Animated.Value(0)).current; // Valor animado para la opacidad
  const [userName, setUserName] = useState(null); // Estado para almacenar el nombre del usuario
  const [isLoading, setIsLoading] = useState(true); // Estado para mostrar un indicador de carga mientras se obtienen los datos del usuario
  const mainButtonScale = useRef(new Animated.Value(1)).current; // Animación para el botón principal
  const secondaryButtonScale = useRef(new Animated.Value(1)).current; // Animación para los botones secundarios

  // Animar la opacidad al montar el componente
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1300,
      useNativeDriver: true,
    }).start();

    // Simulación de carga para efectos visuales
    setTimeout(() => {
      setIsLoading(false);
      setUserName('Usuario de Prueba'); // Simulación de usuario logueado
    }, 2000); // Ajusta el tiempo según sea necesario
  }, [fadeAnim]);

  // Función para manejar la animación de presionar un botón
  const handlePressIn = (buttonScale) => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (buttonScale, navigateTo) => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start(() => {
      if (navigateTo) {
        navigation.navigate(navigateTo);
      }
    });
  };

  // Renderizar la pantalla
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={require('../resources/images/back.png')} // Ruta de la imagen de fondo
        style={styles.background}
        imageStyle={styles.imageStyle}
      >
        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
          {/* Indicador de carga */}
          {isLoading && <ActivityIndicator size="large" color="#5473C2" style={styles.loadingIndicator} />}

          {/* Título de bienvenida */}
          {!isLoading && (
            <>
              <Text style={styles.titleText}>¡Bienvenido!</Text>
              <Text style={styles.subTitleText}>Nos alegra verte aquí.</Text>
            </>
          )}

          {/* Botón principal: Iniciar Sesión */}
          {!isLoading && (
            <TouchableWithoutFeedback
              onPressIn={() => handlePressIn(mainButtonScale)}
              onPressOut={() => handlePressOut(mainButtonScale, 'LogIn')}
            >
              <Animated.View style={[styles.mainButton, { transform: [{ scale: mainButtonScale }] }]}>
                <Text style={styles.mainButtonText}>Iniciar Sesión</Text>
              </Animated.View>
            </TouchableWithoutFeedback>
          )}

          {/* Botones secundarios */}
          {!isLoading && (
            <View style={styles.secondaryButtonsContainer}>
              {/* Botón para ingresar con otra cuenta */}
              <TouchableWithoutFeedback
                onPressIn={() => handlePressIn(secondaryButtonScale)}
                onPressOut={() => handlePressOut(secondaryButtonScale, 'LogIn')}
              >
                <Animated.View style={[styles.secondaryButton, { transform: [{ scale: secondaryButtonScale }] }]}>
                  <Text style={styles.secondaryButtonText}>Ingresar con otra cuenta</Text>
                </Animated.View>
              </TouchableWithoutFeedback>
              {/* Botón para crear cuenta */}
              <TouchableWithoutFeedback
                onPressIn={() => handlePressIn(secondaryButtonScale)}
                onPressOut={() => handlePressOut(secondaryButtonScale, 'SignIn')} // Ajustado correctamente
              >
                <Animated.View style={[styles.secondaryButton, { transform: [{ scale: secondaryButtonScale }] }]}>
                  <Text style={styles.secondaryButtonText}>Crear Cuenta</Text>
                </Animated.View>
              </TouchableWithoutFeedback>

            </View>
          )}
        </Animated.View>

        {/* Pie de página */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 AntoApp. Todos los derechos reservados.</Text>
          <TouchableWithoutFeedback onPress={() => navigation.navigate('Help')}>
            <Text style={styles.helpText}>¿Necesitas ayuda?</Text>
          </TouchableWithoutFeedback>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D1B70',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  imageStyle: {
    opacity: 0.15,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width / 10,
  },
  loadingIndicator: {
    marginBottom: height / 10,
  },
  titleText: {
    fontSize: width / 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: height / 32,
    marginBottom: height / 23,
    textAlign: 'center',
    textShadowColor: '#5473C2',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  subTitleText: {
    fontSize: width / 20,
    color: '#A3ADDBCC', // Más contraste
    textAlign: 'center',
    marginBottom: height / 10,
  },
  mainButton: {
    backgroundColor: '#5127DB',
    paddingVertical: height / 52,
    paddingHorizontal: width / 10,
    borderRadius: 30,
    marginBottom: height / 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: width / 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButtonsContainer: {
    marginTop: height / 10,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButton: {
    paddingVertical: height / 48,
    paddingHorizontal: width / 100,
    marginVertical: height / 50,
    marginTop: height / 90,
    backgroundColor: '#CECFDB',
    borderRadius: 25, // Más redondeado
    width: '70%',
    alignItems: 'center',
    justifyContent: 'center',
    activeOpacity: 0.8,
  },
  secondaryButtonText: {
    fontSize: width / 25,
    color: '#1D1B70',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: height / 25, // Más cerca del borde
    width: '100%',
    alignItems: 'center',
  },
  footerText: {
    fontSize: width / 30,
    color: '#CECFDBAA', // Más discreto
    textAlign: 'center',
  },
  helpText: {
    fontSize: width / 30,
    color: '#1ADDDB',
    fontWeight: 'bold',
    marginTop: height / 80,
  },
});

export default HomeScreen;
