import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Linking,
  Dimensions,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const HelpScreen = ({ navigation }) => {
  const [expandedSection, setExpandedSection] = useState(null);
  const [suggestion, setSuggestion] = useState('');

  const faqData = [
    {
      id: 1,
      question: '¿Cómo uso esta aplicación?',
      answer: `Para comenzar, inicia sesión con tus credenciales o crea una nueva cuenta. 
Desde el panel principal, puedes acceder a varias funcionalidades como:

- Usar el chat para interactuar con Anto, quien está aquí para brindarte apoyo emocional y psicológico, así como responder tus preguntas.
- Consultar tu progreso en hábitos y tareas diarias.
- Explorar recursos adicionales como guías, tutoriales y consejos motivacionales.`,
    },
    {
      id: 2,
      question: '¿Para qué sirve esta aplicación?',
      answer: `La aplicación está diseñada para ayudarte a gestionar tu bienestar emocional y salud mental a través de:

- Herramientas interactivas como un chat con inteligencia artificial (Anto) que te escucha, entiende y responde.
- Seguimiento de tus emociones y hábitos diarios para observar tu progreso y ayudarte a mejorar.
- Recursos educativos y motivacionales para apoyarte en tu camino.`,
    },
    {
      id: 3,
      question: '¿Cómo se utilizan mis datos?',
      answer: `La privacidad y seguridad de tus datos son una prioridad para nosotros. 
Los datos que proporcionas, como tu nombre, emociones o hábitos, se usan para personalizar tu experiencia dentro de la aplicación.
- No compartimos tu información con terceros.
- Toda la información está encriptada y almacenada de forma segura.
- Puedes consultar nuestra Política de Privacidad para más detalles.`,
    },
  ];

  const handleSectionToggle = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSection(expandedSection === id ? null : id);
  };

  const handleLinkPress = (url) => {
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'No se pudo abrir el enlace. Por favor, inténtalo nuevamente.')
    );
  };

  const handleSuggestionSubmit = () => {
    if (suggestion.trim().length < 10) {
      Alert.alert(
        'Error',
        'Por favor, escribe una sugerencia más detallada (al menos 10 caracteres).'
      );
      return;
    }
    Alert.alert('Gracias', 'Tu sugerencia ha sido enviada con éxito.');
    setSuggestion('');
  };

  const renderExpandableSection = (title, content, id) => (
    <View style={styles.section}>
      <TouchableOpacity onPress={() => handleSectionToggle(id)} style={styles.expandableHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Icon
          name={expandedSection === id ? 'chevron-up' : 'chevron-down'}
          size={24}
          color="#A3ADDB"
        />
      </TouchableOpacity>
      {expandedSection === id && <Text style={styles.sectionText}>{content}</Text>}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Título */}
      <Text style={styles.title}>Ayuda</Text>

      {/* FAQ Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preguntas Frecuentes</Text>
        {faqData.map((item) => (
          <View key={item.id} style={styles.expandableItem}>
            <TouchableOpacity onPress={() => handleSectionToggle(item.id)}>
              <View style={styles.expandableHeader}>
                <Text style={styles.expandableTitle}>{item.question}</Text>
                <Icon
                  name={expandedSection === item.id ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#A3ADDB"
                />
              </View>
            </TouchableOpacity>
            {expandedSection === item.id && <Text style={styles.expandableText}>{item.answer}</Text>}
          </View>
        ))}
      </View>
      {renderExpandableSection(
          'Acerca de la App',
          `Nuestra aplicación utiliza inteligencia artificial, combinada con herramientas prácticas de psicología, para ofrecer:

        - Un chat interactivo y motivacional diseñado para acompañarte emocionalmente.
        - Seguimiento de emociones y hábitos que promueve la autoexploración.
        - Alarmas y recordatorios personalizados para mantener tus hábitos y tareas importantes al día.

        Con un enfoque centrado en el usuario, nuestra misión es democratizar el acceso a herramientas de bienestar emocional.`,
          101
        )}

        {renderExpandableSection(
          'Sobre el Desarrollador',
          `Soy Marcelo Ull Marambio, un desarrollador apasionado por la inteligencia artificial y su capacidad para cambiar vidas. Este proyecto es un tributo a mi hija Anto, quien inspira cada línea de código y cada funcionalidad que buscas.

        Mi compromiso es crear tecnología significativa que empodere y mejore la vida de las personas, permitiendo que herramientas como Anto sean accesibles para todos.`,
          102
        )}


      {/* Formulario de Sugerencias */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Formulario de Sugerencias</Text>
        <TextInput
          style={styles.suggestionInput}
          placeholder="Escribe tu sugerencia aquí..."
          placeholderTextColor="#A3ADDB"
          value={suggestion}
          onChangeText={setSuggestion}
          multiline
        />
        <TouchableOpacity style={styles.submitButton} onPress={handleSuggestionSubmit}>
          <Text style={styles.submitButtonText}>Enviar Sugerencia</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D1B70',
    paddingHorizontal: width / 25,
    paddingTop: height / 40,
  },
  title: {
    fontSize: width / 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: height / 50,
    marginTop: height / 60,
  },
  section: {
    marginBottom: height / 50,
  },
  expandableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4, // Reducido para un diseño más compacto
  },
  sectionTitle: {
    fontSize: width / 22,
    color: '#A3ADDB',
    fontWeight: 'bold',
    marginBottom: height / 100,
  },
  sectionText: {
    fontSize: width / 28,
    color: '#A3ADDB',
    marginTop: height / 150, // Espaciado mínimo
    lineHeight: width / 20,
    paddingHorizontal: width / 40, // Márgenes internos ajustados
  },
  expandableItem: {
    marginBottom: height / 100,
  },
  expandableTitle: {
    fontSize: width / 26,
    color: '#FFFFFF',
  },
  expandableText: {
    fontSize: width / 30,
    color: '#A3ADDB',
    marginTop: height / 150,
    lineHeight: width / 22,
    paddingLeft: width / 30,
  },
  suggestionInput: {
    backgroundColor: '#CECFDB',
    color: '#1D1B70',
    borderRadius: 8, // Bordes ligeramente redondeados
    padding: width / 40,
    fontSize: width / 26,
    marginBottom: height / 70,
  },
  submitButton: {
    backgroundColor: '#5127DB',
    borderRadius: 8,
    paddingVertical: height / 120,
    alignItems: 'center',
    marginTop: height / 90,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: width / 26,
  },
});

export default HelpScreen;
