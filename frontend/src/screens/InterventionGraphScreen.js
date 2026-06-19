/**
 * Redirige al resumen unificado (compatibilidad de rutas).
 */
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

export default function InterventionGraphScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.replace('ActivitySummary');
  }, [navigation]);

  return null;
}
