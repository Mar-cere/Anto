const greetingsByLanguage = {
  es: {
    madrugada: [
      'Aqui estoy para ti',
      'Despierto a esta hora? Cuenta conmigo',
      'Siempre disponible, incluso de madrugada',
      'Un abrazo nocturno',
    ],
    manana: [
      'Buenos dias',
      'Buen dia',
      'Hola! Que tengas un gran dia',
      'Energia para hoy',
    ],
    mediodia: [
      'Buen mediodia',
      'Hola!',
      'Pausa y respira',
      'Mitad del dia, animo!',
    ],
    tarde: [
      'Buenas tardes',
      'Hola!',
      'Sigue adelante esta tarde',
      'Aqui para ti esta tarde',
    ],
    noche: [
      'Buenas noches',
      'Que descanses',
      'Aqui si necesitas hablar',
      'Noche tranquila',
    ],
  },
  en: {
    madrugada: [
      'I am here for you',
      'Up at this hour? Count on me',
      'Always here, even at night',
      'A calm night hug',
    ],
    manana: [
      'Good morning',
      'Morning!',
      'Hello! Have a great day',
      'Energy for today',
    ],
    mediodia: [
      'Good midday',
      'Hello!',
      'Pause and breathe',
      'Midday already, keep going!',
    ],
    tarde: [
      'Good afternoon',
      'Hello!',
      'Keep going this afternoon',
      'Here for you this afternoon',
    ],
    noche: [
      'Good evening',
      'Rest well',
      'Here if you need to talk',
      'Calm night',
    ],
  },
};

const weekDaysByLanguage = {
  es: ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

const happyPrefixByLanguage = {
  es: 'Feliz',
  en: 'Happy',
};

export function getGreetingByHourAndDayAndName({
  hour = new Date().getHours(),
  dayIndex = new Date().getDay(),
  userName = '',
  language = 'es',
} = {}) {
  const safeLanguage = language === 'en' ? 'en' : 'es';
  const greetingsRepertoire = greetingsByLanguage[safeLanguage];
  let baseGreeting = '';
  if (hour >= 0 && hour < 6) {
    baseGreeting = randomFromArray(greetingsRepertoire.madrugada);
  } else if (hour >= 6 && hour < 12) {
    baseGreeting = randomFromArray(greetingsRepertoire.manana);
  } else if (hour >= 12 && hour < 14) {
    baseGreeting = randomFromArray(greetingsRepertoire.mediodia);
  } else if (hour >= 14 && hour < 19) {
    baseGreeting = randomFromArray(greetingsRepertoire.tarde);
  } else {
    baseGreeting = randomFromArray(greetingsRepertoire.noche);
  }

  const dia = weekDaysByLanguage[safeLanguage][dayIndex];
  const happyPrefix = happyPrefixByLanguage[safeLanguage];

  // Saludo breve y personalizado, día en nueva línea
  if (userName) {
    return `${baseGreeting}, ${userName}.\n${happyPrefix} ${dia}`;
  }
  return `${baseGreeting}.\n${happyPrefix} ${dia}`;
}

function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
