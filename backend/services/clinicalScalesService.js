/**
 * Servicio de Escalas Clínicas Validadas
 * Administra escalas de evaluación psicológica validadas científicamente
 * - PHQ-9: Patient Health Questionnaire (Depresión)
 * - GAD-7: Generalized Anxiety Disorder Scale (Ansiedad)
 */

import Message from '../models/Message.js';
import mongoose from 'mongoose';

class ClinicalScalesService {
  constructor() {
    // Definición de escalas
    this.scales = {
      PHQ9: {
        name: 'PHQ-9 (Patient Health Questionnaire)',
        description: 'Escala de 9 ítems para evaluar síntomas de depresión',
        items: [
          {
            id: 1,
            question: 'Poco interés o placer en hacer las cosas',
            symptom: 'anhedonia'
          },
          {
            id: 2,
            question: 'Sentirse decaído, deprimido o sin esperanza',
            symptom: 'depressed_mood'
          },
          {
            id: 3,
            question: 'Problemas para dormir, quedarse dormido o dormir demasiado',
            symptom: 'sleep_disturbance'
          },
          {
            id: 4,
            question: 'Sentirse cansado o tener poca energía',
            symptom: 'fatigue'
          },
          {
            id: 5,
            question: 'Poco apetito o comer en exceso',
            symptom: 'appetite_changes'
          },
          {
            id: 6,
            question: 'Sentirse mal consigo mismo o que ha fallado o ha decepcionado a su familia',
            symptom: 'self_worth'
          },
          {
            id: 7,
            question: 'Problemas para concentrarse en cosas como leer el periódico o ver televisión',
            symptom: 'concentration'
          },
          {
            id: 8,
            question: 'Moverse o hablar tan lento que otras personas lo notarían, o lo contrario: estar tan inquieto o agitado que se mueve mucho más de lo normal',
            symptom: 'psychomotor'
          },
          {
            id: 9,
            question: 'Pensamientos de que estaría mejor muerto o de lastimarse de alguna manera',
            symptom: 'suicidal_ideation'
          }
        ],
        scoring: {
          // Cada ítem se puntúa de 0 a 3
          // 0 = Nada en absoluto
          // 1 = Varios días
          // 2 = Más de la mitad de los días
          // 3 = Casi todos los días
          interpretation: {
            minimal: { min: 0, max: 4, severity: 'Mínima', recommendation: 'Seguimiento rutinario' },
            mild: { min: 5, max: 9, severity: 'Leve', recommendation: 'Monitoreo y apoyo' },
            moderate: { min: 10, max: 14, severity: 'Moderada', recommendation: 'Intervención activa recomendada' },
            moderately_severe: { min: 15, max: 19, severity: 'Moderadamente severa', recommendation: 'Tratamiento activo recomendado' },
            severe: { min: 20, max: 27, severity: 'Severa', recommendation: 'Tratamiento inmediato y seguimiento cercano' }
          }
        }
      },
      GAD7: {
        name: 'GAD-7 (Generalized Anxiety Disorder Scale)',
        description: 'Escala de 7 ítems para evaluar síntomas de ansiedad generalizada',
        items: [
          {
            id: 1,
            question: 'Sentirse nervioso, ansioso o muy tenso',
            symptom: 'nervousness'
          },
          {
            id: 2,
            question: 'No poder dejar de preocuparse o controlar las preocupaciones',
            symptom: 'worry_control'
          },
          {
            id: 3,
            question: 'Preocuparse demasiado por diferentes cosas',
            symptom: 'excessive_worry'
          },
          {
            id: 4,
            question: 'Dificultad para relajarse',
            symptom: 'relaxation_difficulty'
          },
          {
            id: 5,
            question: 'Estar tan inquieto que es difícil quedarse quieto',
            symptom: 'restlessness'
          },
          {
            id: 6,
            question: 'Molestarse o irritarse fácilmente',
            symptom: 'irritability'
          },
          {
            id: 7,
            question: 'Sentir miedo de que algo terrible pueda suceder',
            symptom: 'fear'
          }
        ],
        scoring: {
          // Cada ítem se puntúa de 0 a 3
          // 0 = Nada en absoluto
          // 1 = Varios días
          // 2 = Más de la mitad de los días
          // 3 = Casi todos los días
          interpretation: {
            minimal: { min: 0, max: 4, severity: 'Mínima', recommendation: 'Seguimiento rutinario' },
            mild: { min: 5, max: 9, severity: 'Leve', recommendation: 'Monitoreo y apoyo' },
            moderate: { min: 10, max: 14, severity: 'Moderada', recommendation: 'Intervención activa recomendada' },
            severe: { min: 15, max: 21, severity: 'Severa', recommendation: 'Tratamiento inmediato y seguimiento cercano' }
          }
        }
      }
    };

    // Frecuencia recomendada de evaluación (en días)
    this.evaluationFrequency = {
      PHQ9: 14, // Cada 2 semanas
      GAD7: 14  // Cada 2 semanas
    };
  }

  /**
   * Determina si se debe administrar una escala basado en el análisis emocional
   * @param {Object} emotionalAnalysis - Análisis emocional actual
   * @param {Object} contextualAnalysis - Análisis contextual
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object|null>} Escala recomendada o null
   */
  async shouldAdministerScale(emotionalAnalysis, contextualAnalysis, userId) {
    try {
      const emotion = emotionalAnalysis?.mainEmotion;
      const intensity = emotionalAnalysis?.intensity || 5;
      
      // Verificar última evaluación
      const lastEvaluations = await this.getLastEvaluations(userId);
      
      // PHQ-9: Para depresión/tristeza persistente o intensa
      if ((emotion === 'tristeza' && intensity >= 6) || 
          (emotion === 'tristeza' && contextualAnalysis?.tema?.categoria === 'salud_mental')) {
        const daysSincePHQ9 = this.getDaysSinceEvaluation(lastEvaluations.PHQ9);
        if (daysSincePHQ9 >= this.evaluationFrequency.PHQ9) {
          return {
            scale: 'PHQ9',
            reason: 'Síntomas de depresión detectados',
            priority: intensity >= 8 ? 'high' : 'medium'
          };
        }
      }
      
      // GAD-7: Para ansiedad persistente o intensa
      if ((emotion === 'ansiedad' && intensity >= 6) || 
          (emotion === 'miedo' && intensity >= 6)) {
        const daysSinceGAD7 = this.getDaysSinceEvaluation(lastEvaluations.GAD7);
        if (daysSinceGAD7 >= this.evaluationFrequency.GAD7) {
          return {
            scale: 'GAD7',
            reason: 'Síntomas de ansiedad detectados',
            priority: intensity >= 8 ? 'high' : 'medium'
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('[ClinicalScalesService] Error determinando escala:', error);
      return null;
    }
  }

  /**
   * Obtiene las últimas evaluaciones del usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Últimas evaluaciones por escala
   */
  async getLastEvaluations(userId) {
    try {
      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const messages = await Message.find({
        userId,
        'metadata.clinicalScale': { $exists: true },
        createdAt: { $gte: last30Days }
      })
      .sort({ createdAt: -1 })
      .lean();
      
      const evaluations = {
        PHQ9: null,
        GAD7: null
      };
      
      messages.forEach(msg => {
        const scale = msg.metadata?.clinicalScale?.scale;
        const timestamp = msg.metadata?.clinicalScale?.timestamp;
        if (scale === 'PHQ9' && !evaluations.PHQ9) {
          evaluations.PHQ9 = timestamp || msg.createdAt;
        }
        if (scale === 'GAD7' && !evaluations.GAD7) {
          evaluations.GAD7 = timestamp || msg.createdAt;
        }
      });
      
      return evaluations;
    } catch (error) {
      console.error('[ClinicalScalesService] Error obteniendo evaluaciones:', error);
      return { PHQ9: null, GAD7: null };
    }
  }

  /**
   * Calcula días desde una evaluación
   * @param {Date|null} evaluationDate - Fecha de evaluación
   * @returns {number} Días transcurridos
   */
  getDaysSinceEvaluation(evaluationDate) {
    if (!evaluationDate) return Infinity;
    const date = evaluationDate instanceof Date ? evaluationDate : new Date(evaluationDate);
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Completa automáticamente una escala basándose en el contenido y análisis emocional
   * @param {string} content - Contenido del mensaje
   * @param {string} scaleName - Nombre de la escala (PHQ9 o GAD7)
   * @param {Object} emotionalAnalysis - Análisis emocional (opcional)
   * @param {Object} contextualAnalysis - Análisis contextual (opcional)
   * @param {Array} recentHistory - Historial reciente de mensajes (opcional)
   * @returns {Object} Escala completada con puntuaciones por ítem
   */
  completeScaleAutomatically(content, scaleName, emotionalAnalysis = null, contextualAnalysis = null, recentHistory = []) {
    const scale = this.scales[scaleName];
    if (!scale) return null;
    
    const contentLower = content.toLowerCase();
    const itemScores = [];
    let totalScore = 0;
    
    // Combinar contenido actual con historial reciente para mejor análisis
    const combinedContent = [content, ...recentHistory.map(m => m.content || '').slice(0, 3)]
      .filter(c => c)
      .join(' ')
      .toLowerCase();
    
    // Patrones mejorados para cada síntoma con múltiples variaciones
    const symptomPatterns = {
      PHQ9: {
        anhedonia: {
          patterns: [
            /(?:no.*interés|sin.*placer|nada.*me.*gusta|no.*disfruto|perdí.*interés|ya.*no.*me.*gusta)/i,
            /(?:no.*tengo.*ganas|sin.*motivación|no.*me.*apetece)/i
          ],
          intensity: emotionalAnalysis?.mainEmotion === 'tristeza' ? 1 : 0
        },
        depressed_mood: {
          patterns: [
            /(?:deprimido|decaído|sin.*esperanza|triste|vacío|sin.*sentido|me.*siento.*mal)/i,
            /(?:sin.*ánimo|desanimado|desesperanzado|sin.*motivo)/i
          ],
          intensity: emotionalAnalysis?.mainEmotion === 'tristeza' ? (emotionalAnalysis?.intensity || 5) / 3 : 0
        },
        sleep_disturbance: {
          patterns: [
            /(?:problemas.*dormir|insomnio|duermo.*demasiado|no.*puedo.*dormir|sueño.*interrumpido)/i,
            /(?:me.*despierto|no.*duermo.*bien|duermo.*poco|sueño.*inquieto)/i
          ],
          intensity: 0
        },
        fatigue: {
          patterns: [
            /(?:cansado|sin.*energía|fatiga|agotado|sin.*fuerzas|sin.*vitalidad)/i,
            /(?:me.*siento.*débil|sin.*ganas.*de.*nada|exhausto)/i
          ],
          intensity: emotionalAnalysis?.mainEmotion === 'tristeza' ? 1 : 0
        },
        appetite_changes: {
          patterns: [
            /(?:poco.*apetito|como.*demasiado|perdí.*apetito|no.*tengo.*hambre|como.*mucho)/i,
            /(?:no.*me.*apetece.*comer|como.*sin.*hambre|apetito.*cambiado)/i
          ],
          intensity: 0
        },
        self_worth: {
          patterns: [
            /(?:soy.*un.*fracaso|he.*fallado|no.*sirvo|soy.*inútil|me.*siento.*mal.*conmigo)/i,
            /(?:no.*valgo|soy.*malo|no.*soy.*bueno|me.*odio)/i
          ],
          intensity: contextualAnalysis?.cognitiveDistortions?.some(d => d.type === 'labeling' || d.type === 'personalization') ? 2 : 0
        },
        concentration: {
          patterns: [
            /(?:problemas.*concentrarme|no.*puedo.*enfocarme|distraído|pérdida.*concentración)/i,
            /(?:no.*puedo.*pensar|mente.*nublada|olvido.*cosas)/i
          ],
          intensity: 0
        },
        psychomotor: {
          patterns: [
            /(?:lento|inquieto|agitado|no.*puedo.*quedarme.*quieto|me.*muevo.*mucho)/i,
            /(?:me.*siento.*lento|muy.*inquieto|agitación)/i
          ],
          intensity: 0
        },
        suicidal_ideation: {
          patterns: [
            /(?:mejor.*muerto|lastimarme|suicid|morir|no.*quiero.*vivir)/i,
            /(?:no.*tiene.*sentido.*vivir|preferiría.*no.*existir)/i
          ],
          intensity: emotionalAnalysis?.intensity >= 9 ? 3 : 0
        }
      },
      GAD7: {
        nervousness: {
          patterns: [
            /(?:nervioso|ansioso|tenso|inquieto|agitado|preocupado)/i,
            /(?:me.*siento.*nervioso|ansiedad|tensión)/i
          ],
          intensity: emotionalAnalysis?.mainEmotion === 'ansiedad' ? (emotionalAnalysis?.intensity || 5) / 3 : 0
        },
        worry_control: {
          patterns: [
            /(?:no.*puedo.*dejar.*de.*preocuparme|preocupaciones.*sin.*control|me.*preocupo.*demasiado)/i,
            /(?:no.*puedo.*controlar.*preocupaciones|preocupaciones.*constantes)/i
          ],
          intensity: emotionalAnalysis?.mainEmotion === 'ansiedad' ? 2 : 0
        },
        excessive_worry: {
          patterns: [
            /(?:me.*preocupo.*por.*todo|preocupaciones.*constantes|siempre.*preocupado)/i,
            /(?:me.*preocupo.*demasiado|preocupaciones.*excesivas)/i
          ],
          intensity: emotionalAnalysis?.mainEmotion === 'ansiedad' ? 2 : 0
        },
        relaxation_difficulty: {
          patterns: [
            /(?:no.*puedo.*relajarme|dificultad.*relajarme|siempre.*tenso)/i,
            /(?:no.*puedo.*calmarme|siempre.*nervioso)/i
          ],
          intensity: emotionalAnalysis?.mainEmotion === 'ansiedad' ? 1 : 0
        },
        restlessness: {
          patterns: [
            /(?:inquieto|no.*puedo.*quedarme.*quieto|agitado|nervioso)/i,
            /(?:me.*siento.*inquieto|agitación)/i
          ],
          intensity: emotionalAnalysis?.mainEmotion === 'ansiedad' ? 1 : 0
        },
        irritability: {
          patterns: [
            /(?:irritable|me.*molesto.*fácil|me.*irrito|mal.*humor)/i,
            /(?:me.*enojo.*fácil|irritado)/i
          ],
          intensity: emotionalAnalysis?.mainEmotion === 'enojo' ? 2 : 0
        },
        fear: {
          patterns: [
            /(?:miedo.*terrible|algo.*malo.*va.*a.*pasar|temor|pánico)/i,
            /(?:tengo.*miedo|aterrorizado|pánico)/i
          ],
          intensity: emotionalAnalysis?.mainEmotion === 'miedo' ? (emotionalAnalysis?.intensity || 5) / 3 : 0
        }
      }
    };
    
    const patterns = symptomPatterns[scaleName];
    if (!patterns) return null;
    
    // Evaluar cada ítem de la escala
    scale.items.forEach(item => {
      const symptomData = patterns[item.symptom];
      if (!symptomData) {
        // Si no hay patrón, dar 0
        itemScores.push({
          itemId: item.id,
          score: 0,
          question: item.question,
          confidence: 0
        });
        return;
      }
      
      // Verificar si algún patrón coincide
      let matched = false;
      let maxFrequency = 0;
      
      for (const pattern of symptomData.patterns) {
        if (pattern.test(combinedContent)) {
          matched = true;
          // Determinar frecuencia basada en palabras clave
          let frequency = 1; // Varios días por defecto
          
          if (/(?:siempre|constantemente|todos.*los.*días|diario|todos.*los.*días|todos.*los.*días)/i.test(combinedContent)) {
            frequency = 3; // Casi todos los días
          } else if (/(?:muchas.*veces|frecuentemente|a.*menudo|más.*de.*la.*mitad|varios.*días)/i.test(combinedContent)) {
            frequency = 2; // Más de la mitad de los días
          }
          
          maxFrequency = Math.max(maxFrequency, frequency);
        }
      }
      
      // Ajustar basado en intensidad emocional si está disponible
      let finalScore = 0;
      if (matched) {
        finalScore = maxFrequency;
        // Ajustar según intensidad emocional si es relevante
        if (symptomData.intensity > 0) {
          const intensityAdjustment = Math.min(Math.floor(symptomData.intensity), 1);
          finalScore = Math.max(finalScore, intensityAdjustment);
        }
      } else if (symptomData.intensity >= 2) {
        // Si hay alta intensidad emocional pero no se mencionó explícitamente, dar puntuación baja
        finalScore = 1;
      }
      
      // Limitar a 0-3
      finalScore = Math.min(Math.max(finalScore, 0), 3);
      
      totalScore += finalScore;
      itemScores.push({
        itemId: item.id,
        score: finalScore,
        question: item.question,
        confidence: matched ? 0.8 : (symptomData.intensity > 0 ? 0.5 : 0.1)
      });
    });
    
    return {
      totalScore,
      itemScores,
      interpretation: this.interpretScore(totalScore, scaleName),
      completedAutomatically: true,
      confidence: itemScores.filter(i => i.score > 0).length / itemScores.length
    };
  }

  /**
   * Analiza el contenido del mensaje para inferir puntuación de escala (método legacy, mejor usar completeScaleAutomatically)
   * @param {string} content - Contenido del mensaje
   * @param {string} scaleName - Nombre de la escala (PHQ9 o GAD7)
   * @returns {Object} Puntuación inferida y síntomas detectados
   */
  analyzeContentForScale(content, scaleName) {
    // Usar el nuevo método mejorado
    return this.completeScaleAutomatically(content, scaleName);
  }

  /**
   * Interpreta la puntuación de una escala
   * @param {number} score - Puntuación total
   * @param {string} scaleName - Nombre de la escala
   * @returns {Object} Interpretación de la puntuación
   */
  interpretScore(score, scaleName) {
    const scale = this.scales[scaleName];
    if (!scale) return null;
    
    const interpretations = scale.scoring.interpretation;
    
    for (const [key, value] of Object.entries(interpretations)) {
      if (score >= value.min && score <= value.max) {
        return {
          severity: value.severity,
          recommendation: value.recommendation,
          level: key
        };
      }
    }
    
    return {
      severity: 'No determinado',
      recommendation: 'Evaluación adicional recomendada',
      level: 'unknown'
    };
  }

  /**
   * Genera un mensaje para sugerir la administración de una escala
   * @param {string} scaleName - Nombre de la escala
   * @param {string} reason - Razón para la evaluación
   * @returns {string} Mensaje sugerido
   */
  generateScaleSuggestion(scaleName, reason) {
    const scale = this.scales[scaleName];
    if (!scale) return null;
    
    return {
      message: `He notado ${reason}. ¿Te gustaría hacer una evaluación breve para entender mejor cómo te sientes? Es una herramienta validada que nos ayudará a identificar áreas específicas de apoyo.`,
      scaleName: scale.name,
      scaleDescription: scale.description,
      estimatedTime: '2-3 minutos'
    };
  }

  /**
   * Obtiene la definición completa de una escala
   * @param {string} scaleName - Nombre de la escala
   * @returns {Object|null} Definición de la escala
   */
  getScaleDefinition(scaleName) {
    return this.scales[scaleName] || null;
  }
}

export default new ClinicalScalesService();

