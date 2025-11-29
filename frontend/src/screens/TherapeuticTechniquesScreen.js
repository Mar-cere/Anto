/**
 * Pantalla de Técnicas Terapéuticas
 * 
 * Muestra todas las técnicas terapéuticas disponibles organizadas por categoría
 * (CBT, DBT, ACT) y por emoción. Permite navegar a ejercicios interactivos
 * y ver guías paso a paso.
 * 
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import FloatingNavBar from '../components/FloatingNavBar';
import Header from '../components/Header';
import ParticleBackground from '../components/ParticleBackground';
import TechniqueCard from '../components/therapeutic/TechniqueCard';
import { api, ENDPOINTS } from '../config/api';
import { colors } from '../styles/globalStyles';

// Constantes de categorías
const CATEGORIES = {
  IMMEDIATE: 'immediate',
  CBT: 'CBT',
  DBT: 'DBT',
  ACT: 'ACT',
};

// Constantes de textos
const TEXTS = {
  TITLE: 'Técnicas Terapéuticas',
  SUBTITLE: 'Herramientas basadas en evidencia para tu bienestar',
  CATEGORY_IMMEDIATE: 'Técnicas Inmediatas',
  CATEGORY_CBT: 'Terapia Cognitivo-Conductual (TCC)',
  CATEGORY_DBT: 'Terapia Dialéctica Conductual (DBT)',
  CATEGORY_ACT: 'Terapia de Aceptación y Compromiso (ACT)',
  LOADING: 'Cargando técnicas...',
  ERROR: 'Error al cargar las técnicas',
  RETRY: 'Reintentar',
  NO_TECHNIQUES: 'No hay técnicas disponibles',
  FILTER_BY_EMOTION: 'Filtrar por emoción',
  ALL_EMOTIONS: 'Todas las emociones',
};

// Emociones disponibles
const EMOTIONS = [
  { key: 'all', label: 'Todas', icon: 'emoticon-happy' },
  { key: 'tristeza', label: 'Tristeza', icon: 'emoticon-sad' },
  { key: 'ansiedad', label: 'Ansiedad', icon: 'emoticon-worried' },
  { key: 'enojo', label: 'Enojo', icon: 'emoticon-angry' },
  { key: 'miedo', label: 'Miedo', icon: 'emoticon-frightened' },
  { key: 'verguenza', label: 'Vergüenza', icon: 'emoticon-embarrassed' },
  { key: 'culpa', label: 'Culpa', icon: 'emoticon-cry' },
  { key: 'alegria', label: 'Alegría', icon: 'emoticon-happy' },
  { key: 'esperanza', label: 'Esperanza', icon: 'emoticon-excited' },
];

const TherapeuticTechniquesScreen = () => {
  const navigation = useNavigation();
  const [selectedEmotion, setSelectedEmotion] = useState('all');
  const [techniques, setTechniques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Cargar técnicas desde el backend
  const loadTechniques = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get(ENDPOINTS.THERAPEUTIC_TECHNIQUES);
      setTechniques(response.data || []);
    } catch (err) {
      console.error('Error cargando técnicas:', err);
      setError(TEXTS.ERROR);
      // Si no hay endpoint, usar técnicas locales como fallback
      setTechniques([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadTechniques();
  }, [loadTechniques]);

  // Filtrar técnicas por emoción seleccionada
  const filteredTechniques = React.useMemo(() => {
    if (selectedEmotion === 'all') return techniques;
    return techniques.filter(t => 
      t.emotions?.includes(selectedEmotion) || 
      t.emotion === selectedEmotion
    );
  }, [techniques, selectedEmotion]);

  // Agrupar técnicas por categoría
  const groupedTechniques = React.useMemo(() => {
    const groups = {
      [CATEGORIES.IMMEDIATE]: [],
      [CATEGORIES.CBT]: [],
      [CATEGORIES.DBT]: [],
      [CATEGORIES.ACT]: [],
    };

    filteredTechniques.forEach(technique => {
      const category = technique.category || technique.type || CATEGORIES.IMMEDIATE;
      if (groups[category]) {
        groups[category].push(technique);
      } else {
        groups[CATEGORIES.IMMEDIATE].push(technique);
      }
    });

    return groups;
  }, [filteredTechniques]);

  // Manejar refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadTechniques();
  }, [loadTechniques]);

  // Manejar selección de emoción
  const handleEmotionSelect = useCallback((emotion) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEmotion(emotion);
  }, []);

  // Navegar a detalle de técnica
  const handleTechniquePress = useCallback((technique) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('TechniqueDetail', { technique });
  }, [navigation]);

  // Renderizar filtro de emociones
  const renderEmotionFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.emotionFilter}
      contentContainerStyle={styles.emotionFilterContent}
    >
      {EMOTIONS.map((emotion) => (
        <TouchableOpacity
          key={emotion.key}
          style={[
            styles.emotionButton,
            selectedEmotion === emotion.key && styles.emotionButtonActive
          ]}
          onPress={() => handleEmotionSelect(emotion.key)}
        >
          <MaterialCommunityIcons
            name={emotion.icon}
            size={20}
            color={selectedEmotion === emotion.key ? colors.white : colors.primary}
          />
          <Text
            style={[
              styles.emotionButtonText,
              selectedEmotion === emotion.key && styles.emotionButtonTextActive
            ]}
          >
            {emotion.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Renderizar sección de categoría
  const renderCategorySection = (category, title, techniques) => {
    if (!techniques || techniques.length === 0) return null;

    return (
      <View style={styles.categorySection}>
        <Text style={styles.categoryTitle}>{title}</Text>
        {techniques.map((technique, index) => (
          <TechniqueCard
            key={technique.id || index}
            technique={technique}
            onPress={() => handleTechniquePress(technique)}
          />
        ))}
      </View>
    );
  };

  // Renderizar contenido
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{TEXTS.LOADING}</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadTechniques}>
            <Text style={styles.retryButtonText}>{TEXTS.RETRY}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (filteredTechniques.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="book-open-variant" size={48} color={colors.accent} />
          <Text style={styles.emptyText}>{TEXTS.NO_TECHNIQUES}</Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {renderCategorySection(
          CATEGORIES.IMMEDIATE,
          TEXTS.CATEGORY_IMMEDIATE,
          groupedTechniques[CATEGORIES.IMMEDIATE]
        )}
        {renderCategorySection(
          CATEGORIES.CBT,
          TEXTS.CATEGORY_CBT,
          groupedTechniques[CATEGORIES.CBT]
        )}
        {renderCategorySection(
          CATEGORIES.DBT,
          TEXTS.CATEGORY_DBT,
          groupedTechniques[CATEGORIES.DBT]
        )}
        {renderCategorySection(
          CATEGORIES.ACT,
          TEXTS.CATEGORY_ACT,
          groupedTechniques[CATEGORIES.ACT]
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ParticleBackground />
      <Header title={TEXTS.TITLE} showBackButton />
      
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>{TEXTS.SUBTITLE}</Text>
      </View>

      {renderEmotionFilter()}
      {renderContent()}

      <FloatingNavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  subtitleContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emotionFilter: {
    maxHeight: 60,
    marginBottom: 10,
  },
  emotionFilterContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 10,
  },
  emotionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  emotionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  emotionButtonText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  emotionButtonTextActive: {
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  categorySection: {
    marginBottom: 30,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TherapeuticTechniquesScreen;

