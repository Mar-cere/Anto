/**
 * Hook: carga de técnicas, filtro por emoción y agrupación por categoría.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, ENDPOINTS } from '../../config/api';
import {
  CATEGORIES,
  EMOTION_KEYS,
  useTherapeuticTechniquesTexts,
} from './therapeuticTechniquesConstants';
import {
  normalizeTechniqueCategory,
  parseTherapeuticTechniquesResponse,
} from './therapeuticTechniquesUtils';

export function useTherapeuticTechniquesScreen() {
  const TEXTS = useTherapeuticTechniquesTexts();
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [selectedEmotion, setSelectedEmotionState] = useState('all');
  const setSelectedEmotion = useCallback((key) => {
    if (typeof key === 'string' && EMOTION_KEYS.has(key)) {
      setSelectedEmotionState(key);
    }
  }, []);

  const [techniques, setTechniques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadTechniques = useCallback(async ({ isRefresh = false } = {}) => {
    if (!isRefresh) {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await api.get(ENDPOINTS.THERAPEUTIC_TECHNIQUES);
      if (!isMountedRef.current) return;

      const parsed = parseTherapeuticTechniquesResponse(response, TEXTS);
      if (!parsed.ok) {
        setTechniques([]);
        setError(parsed.error);
        return;
      }

      setTechniques(Array.isArray(parsed.data) ? parsed.data : []);
      setError(null);
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('Error cargando técnicas:', err);
      setTechniques([]);
      setError(TEXTS.ERROR);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [TEXTS]);

  useEffect(() => {
    loadTechniques({ isRefresh: false });
  }, [loadTechniques]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadTechniques({ isRefresh: true });
  }, [loadTechniques]);

  const safeTechniques = useMemo(
    () => (Array.isArray(techniques) ? techniques : []),
    [techniques]
  );

  const filteredTechniques = useMemo(() => {
    if (selectedEmotion === 'all') return safeTechniques;
    return safeTechniques.filter((t) => {
      if (t == null || typeof t !== 'object') return false;
      const emotions = Array.isArray(t.emotions) ? t.emotions : [];
      const single = typeof t.emotion === 'string' ? t.emotion : null;
      return emotions.includes(selectedEmotion) || single === selectedEmotion;
    });
  }, [safeTechniques, selectedEmotion]);

  const groupedTechniques = useMemo(() => {
    const groups = {
      [CATEGORIES.IMMEDIATE]: [],
      [CATEGORIES.CBT]: [],
      [CATEGORIES.DBT]: [],
      [CATEGORIES.ACT]: [],
    };

    filteredTechniques.forEach((technique) => {
      if (technique == null || typeof technique !== 'object') return;
      const raw = technique.category ?? technique.type;
      const key = normalizeTechniqueCategory(
        typeof raw === 'string' ? raw : CATEGORIES.IMMEDIATE
      );
      groups[key].push(technique);
    });

    return groups;
  }, [filteredTechniques]);

  return {
    selectedEmotion,
    setSelectedEmotion,
    techniques: safeTechniques,
    filteredTechniques,
    groupedTechniques,
    loading,
    refreshing,
    error,
    loadTechniques,
    handleRefresh,
  };
}
