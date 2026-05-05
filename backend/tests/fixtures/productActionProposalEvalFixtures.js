/**
 * Fixtures de regresión semántica para propuestas productivas.
 * Si estos casos cambian, revisar intencionalidad de producto.
 */
export const PRODUCT_ACTION_PROPOSAL_EVAL_FIXTURES = [
  // --- Explícitos task ---
  { name: 'explicit-task-puedes-generar', text: 'puedes generar la tarea', intention: 'vent', explicit: true, suggest: true, type: 'propose_task' },
  { name: 'explicit-task-crea', text: 'crea la tarea', intention: 'vent', explicit: true, suggest: true, type: 'propose_task' },
  { name: 'explicit-task-genera-una', text: 'genera una tarea', intention: 'vent', explicit: true, suggest: true, type: 'propose_task' },
  { name: 'explicit-task-agregar-a-mis', text: 'agregarlo a mis tareas', intention: 'vent', explicit: true, suggest: true, type: 'propose_task' },
  { name: 'explicit-task-guardame', text: 'guardame como tarea', intention: 'vent', explicit: true, suggest: true, type: 'propose_task' },

  // --- Explícitos habit ---
  { name: 'explicit-habit-puedes-generar', text: 'puedes generar el hábito', intention: 'vent', explicit: true, suggest: true, type: 'propose_habit' },
  { name: 'explicit-habit-crea', text: 'crea un hábito', intention: 'vent', explicit: true, suggest: true, type: 'propose_habit' },
  { name: 'explicit-habit-agregar-a-mis', text: 'agregarlo a mis hábitos', intention: 'vent', explicit: true, suggest: true, type: 'propose_habit' },
  { name: 'explicit-habit-en-mis', text: 'en mis hábitos', intention: 'vent', explicit: true, suggest: true, type: 'propose_habit' },

  // --- Naturales que sí deberían sugerir ---
  { name: 'natural-vent-study-overload', text: 'estoy muy atareado, mañana examen y no sé por dónde empezar a estudiar', intention: 'vent', explicit: false, suggest: true, type: 'propose_task', need: 'high' },
  { name: 'natural-vent-kitchen', text: 'la cocina me agobia y no sé por dónde empezar', intention: 'vent', explicit: false, suggest: true, type: 'propose_task', need: 'high' },
  { name: 'natural-plan-organize-week', text: 'quiero organizar la semana y dejar pasos concretos para mañana', intention: 'plan', explicit: false, suggest: true, type: 'propose_task', need: 'medium' },
  { name: 'natural-technique-with-planning', text: 'necesito una técnica y también organizar tareas pendientes de esta semana', intention: 'technique', explicit: false, suggest: true, type: 'propose_task', need: 'medium' },
  { name: 'natural-habit-daily', text: 'me gustaría un hábito diario de meditación de 5 minutos', intention: 'plan', explicit: false, suggest: true, type: 'propose_habit', need: 'medium' },
  { name: 'natural-habit-water', text: 'quiero tomar más agua cada día', intention: 'organize', explicit: false, suggest: true, type: 'propose_habit', need: 'low' },

  // --- Casos que NO deberían sugerir ---
  { name: 'no-suggest-abstract-overplanning', text: 'me estresa la sobreplanificación, siento mucha autoexigencia', intention: 'vent', explicit: false, suggest: false, need: 'low' },
  { name: 'no-suggest-ask-to-not-suggest', text: 'no me sugieras tareas, solo escuchar por favor', intention: 'vent', explicit: false, suggest: false, need: 'low' },
  { name: 'no-suggest-emotional-only', text: 'solo estoy triste hoy y no tengo ganas de hablar de nada concreto', intention: 'vent', explicit: false, suggest: false, need: 'low' },
  { name: 'no-suggest-short-message', text: 'corto', intention: 'plan', explicit: false, suggest: false, need: 'low' },
  { name: 'no-suggest-technique-no-anchor', text: 'quiero una técnica para respirar', intention: 'technique', explicit: false, suggest: false, need: 'low' },
  { name: 'no-suggest-vent-rumination', text: 'tengo ansiedad y rumiación, solo quiero contarlo', intention: 'vent', explicit: false, suggest: false, need: 'low' },

  // --- Bordes para evitar regresiones ---
  { name: 'edge-explicit-overrides-no-suggest', text: 'no me sugieras tareas, pero puedes crear la tarea de repasar química', intention: 'vent', explicit: true, suggest: true, type: 'propose_task' },
  { name: 'edge-plan-minimum-signal', text: 'ordenar escritorio hoy', intention: 'plan', explicit: false, suggest: true, type: 'propose_task', need: 'high' },
  { name: 'edge-organize-low-signal', text: 'quiero ordenar', intention: 'organize', explicit: false, suggest: true, type: 'propose_task', need: 'medium' },
  { name: 'edge-vent-no-concrete-anchor', text: 'estoy abrumado con todo', intention: 'vent', explicit: false, suggest: false, need: 'low' },
  { name: 'edge-explicit-task-without-accents', text: 'podrias generar la tarea', intention: 'vent', explicit: true, suggest: true, type: 'propose_task' },
  { name: 'edge-explicit-habit-without-accents', text: 'podrias crear un habito', intention: 'vent', explicit: true, suggest: true, type: 'propose_habit' }
];

