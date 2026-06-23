/**
 * Textos de plantillas de correo (es/en). HTML compartido en mailer.js; aquí solo copy visible.
 */
import { APP_NAME, APP_NAME_FULL } from './app.js';
import {
  emailCtaLabel,
  getEmailLegalMedicalDisclaimerPlain,
} from './emailProductCopy.js';
import {
  emailCtaLabelEn,
  getEmailLegalMedicalDisclaimerPlainEn,
} from './emailProductCopy.en.js';
import { normalizeEmailLanguage } from '../utils/emailLanguage.js';

/** @typedef {'es'|'en'} MailerLang */

const STRINGS = {
  es: {
    defaultUser: 'Usuario',
    footer: {
      weeklyReply:
        '¿Dudas sobre la ampliación de prueba? Puedes responder a este correo indicando la dirección con la que inicias sesión en la app. Para otro tipo de consultas, te recomendamos Instagram (enlace arriba).<br>',
      noReply: 'Este es un correo automático, por favor no respondas a este mensaje.<br>',
      instagramHint: 'Feedback rápido, novedades y soporte.',
      rights: 'Todos los derechos reservados.',
    },
    verification: {
      subject: `Código de Verificación - ${APP_NAME_FULL}`,
      preheader: `Tu código para restablecer acceso en ${APP_NAME}.`,
      header: 'Código de verificación',
      intro: 'Usa este código para recuperar tu contraseña:',
      expires: 'Este código expira en',
      minutes: 'minutos',
      ignore: 'Si no solicitaste este código, puedes ignorar este correo.',
    },
    emailVerification: {
      subject: `Verifica tu Email - ${APP_NAME_FULL}`,
      preheader: `Código para verificar tu correo en ${APP_NAME}.`,
      header: 'Verifica tu email',
      intro: (user) => `Hola, ${user}. Para completar el registro, introduce este código:`,
      ignore: 'Si no creaste esta cuenta, puedes ignorar este correo.',
    },
    resetPassword: {
      subject: `Restablecer Contraseña - ${APP_NAME_FULL}`,
      preheader: `Enlace para restablecer contraseña en ${APP_NAME}.`,
      header: 'Restablecer contraseña',
      intro: 'Solicitaste restablecer tu contraseña. Pulsa el botón para continuar:',
      expiresHours: (n) =>
        `Este enlace expira en ${n} hora${n > 1 ? 's' : ''}.`,
      ignore: 'Si no solicitaste restablecer tu contraseña, ignora este correo.',
    },
    welcome: {
      subject: `Bienvenido a ${APP_NAME}`,
      header: (name) => `Bienvenido, ${name}`,
      preheader: (user) =>
        user
          ? `Gracias por registrarte, ${user}. Abre ${APP_NAME} y revisa unos primeros pasos en este correo.`
          : `Gracias por registrarte en ${APP_NAME}. Abre la app y revisa unos primeros pasos en este correo.`,
      body1: (app) =>
        `Gracias por registrarte. <strong>${app}</strong> es un espacio para conversar con calma, ordenar lo que sientes y, si te encaja, usar tareas, hábitos o recordatorios sin una obligación fija.`,
      stepsTitle: 'Primeros pasos',
      step1: '<strong>Abre el chat</strong> y escribe con naturalidad: no hace falta un “tema grande” para empezar.',
      step2:
        '<strong>Tareas, hábitos y pomodoros</strong> desde el chat, cuando te encajen: son un apoyo al día a día, no una obligación.',
      step3:
        '<strong>Resumen semanal y mensual</strong> en Perfil te da perspectiva sobre tu actividad cuando quieras mirar atrás sin presión.',
      step4:
        'Si algo no te encaja en el tono o las sugerencias, <strong>corrige o cambia de tema</strong>: la conversación va a tu ritmo.',
      linkFallback:
        'Si el enlace no abre la app, ábrela manualmente e inicia sesión con esta cuenta.',
      closing: (app) =>
        `Dudas o feedback: puedes escribirnos por los canales que enlazamos abajo (Instagram). Este mensaje es automático; para hablar con ${app}, usa la app.`,
    },
    reEngagement: {
      subject: (app) => `Hace tiempo que no abres ${app}`,
      header: (name) => `Hola, ${name}`,
      preheader: (d, app) =>
        `Hace ${d} día${d !== 1 ? 's' : ''} sin actividad en ${app}. Recordatorio amable: puedes abrir la app cuando te venga bien.`,
      body: (d, app) =>
        `Hace <strong>${d}</strong> día${d !== 1 ? 's' : ''} que no registramos actividad con tu cuenta. No pasa nada: los ritmos cambian. Si te apetece, <strong>${app}</strong> sigue aquí cuando quieras volver.`,
      tipsTitle: 'Una idea para retomar',
      linkFallback:
        'Si el enlace no abre la app, ábrela manualmente e inicia sesión con tu cuenta.',
      closing: (app) =>
        `Gracias por probar ${app}. Dudas o feedback: canales enlazados al pie (Instagram). Este mensaje es automático.`,
      tips: [
        'Escribe con naturalidad cómo te sientes hoy: no hace falta un tema grande para volver a empezar.',
        'Pide una guía breve de relajación o mindfulness cuando necesites bajar la intensidad del día.',
        'Reflexiona con calma sobre emociones y pensamientos; ordenar lo que pasa por la cabeza ya ayuda.',
        'Establece una meta pequeña y realista para hoy; celebrar avances modestos también suma.',
        'Si te sirve mirar atrás, revisa conversaciones anteriores con la misma cuenta.',
      ],
      noChargeNote:
        'Abrir este correo o la app <strong>no genera un cargo adicional</strong>: tu cuenta sigue igual hasta que elijas suscribirte, si en algún momento lo haces.',
      tipsHint:
        'Sugerencia general de una lista rotativa; no está ligada a tu actividad reciente en la app.',
      appActionsTitle: 'Qué puedes hacer en la app',
      appActions: [
        'Chat cuando lo necesites, sin agenda.',
        'Tareas, hábitos y recordatorios si te encajan en tu día a día.',
        'Resumen de actividad en Perfil cuando quieras perspectiva, sin presión.',
      ],
    },
    trialRetention: {
      subject: (app) => `Tu prueba en ${app} termina pronto`,
      header: (name) => `Hola, ${name}`,
      sectionEnding: 'Prueba por terminar',
      bodyIntro: (app) =>
        `Tu periodo gratuito sirve para conocer <strong>${app}</strong> con calma.`,
      preheader: (app, fewHours, hoursLeft, daysApprox) => {
        if (fewHours) {
          return daysApprox != null
            ? `Te quedan pocas horas de prueba (aprox. ${daysApprox} día${daysApprox !== 1 ? 's' : ''}) en ${app}. Puedes ver planes Premium o abrir tu resumen desde este correo.`
            : `Te quedan pocas horas de prueba en ${app}. Puedes ver planes Premium o abrir tu resumen desde este correo.`;
        }
        return daysApprox != null
          ? `Te quedan unas ${hoursLeft} horas de prueba (aprox. ${daysApprox} día${daysApprox !== 1 ? 's' : ''}) en ${app}. Puedes ver planes Premium o abrir tu resumen desde este correo.`
          : `Te quedan unas ${hoursLeft} horas de prueba en ${app}. Puedes ver planes Premium o abrir tu resumen desde este correo.`;
      },
      timeBodyHtml: (fewHours, hoursLeft, daysApprox) => {
        const daysPart =
          daysApprox != null
            ? `, unos <strong>${daysApprox}</strong> día${daysApprox !== 1 ? 's' : ''} a modo orientativo`
            : '';
        const premium =
          ' Si te resulta útil, puedes pasarte a <strong>Premium</strong> y mantener el acceso completo cuando termine la prueba, sin obligación de decidir ya mismo.';
        if (fewHours) {
          return `Te quedan <strong style="color:inherit;">pocas horas</strong> de prueba${daysPart}.${premium}`;
        }
        return `Te quedan aproximadamente <strong style="color:inherit;">${hoursLeft} hora${hoursLeft !== 1 ? 's' : ''}</strong> de prueba${daysPart}.${premium}`;
      },
      premiumTitle: 'Con Premium sigues teniendo',
      premiumBullets: [
        'Chat y herramientas sin el tope de la prueba.',
        'Resumen de actividad y continuidad en tu proceso.',
        'El mismo espacio, con el ritmo que tú elijas.',
      ],
      endDateLabel: 'Fecha orientativa de fin:',
      endDateNote: ' El detalle exacto lo ves en la app con tu sesión iniciada.',
      linkFallback: (app) =>
        `Si el enlace no abre la app, ábrela manualmente e inicia sesión; revisa suscripción o pagos dentro de ${app}.`,
      closing: (app) =>
        `Gracias por probar ${app}. Dudas o feedback: canales enlazados al pie (Instagram). Este mensaje es automático.`,
    },
    weeklyTips: {
      subject: (app, week) => `Tip semanal de ${app} — Semana ${week}`,
      preheader: (app, week) => `Idea breve de bienestar y ${app} (semana ${week}).`,
      header: (week) => `Tip semanal — Semana ${week}`,
      intro: (user) => `Hola, ${user}. Esta semana compartimos un recordatorio sencillo.`,
      tryInChat: 'Prueba en el chat:',
      wellbeing:
        'El bienestar emocional es un proceso; cada paso pequeño cuenta. La app está disponible cuando quieras retomar.',
      linkFallback:
        'Si el enlace no abre la app, ábrela manualmente e inicia sesión con tu cuenta.',
      tips: [
        {
          title: '🌱 Practica la Gratitud',
          content:
            'Cada día, antes de dormir, escribe 3 cosas por las que estás agradecido. Esto ayuda a entrenar tu mente para enfocarse en lo positivo.',
          action: 'Pregúntale a Anto: "¿Cómo puedo practicar la gratitud diariamente?"',
        },
        {
          title: '🧘 Técnica de Respiración 4-7-8',
          content:
            'Inhala por 4 segundos, mantén por 7, exhala por 8. Repite 4 veces. Esta técnica ayuda a reducir la ansiedad y mejorar el sueño.',
          action: 'Pregúntale a Anto: "Enséñame ejercicios de respiración para relajarme"',
        },
        {
          title: '💭 Diario de Emociones',
          content:
            'Escribe cómo te sientes cada día. Identificar tus emociones es el primer paso para gestionarlas mejor.',
          action: 'Pregúntale a Anto: "¿Cómo puedo llevar un diario de emociones?"',
        },
        {
          title: '🌿 Mindfulness de 5 Minutos',
          content:
            'Dedica 5 minutos al día a estar presente. Observa tu respiración, los sonidos alrededor, las sensaciones de tu cuerpo.',
          action: 'Pregúntale a Anto: "Guíame en una meditación de 5 minutos"',
        },
        {
          title: '🤝 Autocompasión',
          content:
            'Trátate con la misma amabilidad que tratarías a un buen amigo. Recuerda que está bien no estar bien todo el tiempo.',
          action: 'Pregúntale a Anto: "¿Cómo puedo practicar la autocompasión?"',
        },
        {
          title: '🎯 Pequeñas Metas',
          content:
            'Establece metas pequeñas y alcanzables. Celebrar pequeños logros construye confianza y motivación.',
          action: 'Pregúntale a Anto: "Ayúdame a establecer metas realistas de bienestar"',
        },
        {
          title: '🌙 Higiene del Sueño',
          content:
            'Mantén un horario regular de sueño. Evita pantallas 1 hora antes de dormir y crea una rutina relajante.',
          action: 'Pregúntale a Anto: "¿Cómo puedo mejorar mi calidad de sueño?"',
        },
      ],
    },
    weeklySummary: {
      header: 'Te escribimos desde Anto',
      greeting: (name) => (name ? `Hola, <strong>${name}</strong> 👋` : 'Hola 👋'),
      greetingPlain: 'Hola',
      highlight: 'Versión 1.5.0',
      linkFallback:
        'Si el enlace no abre la app, inicia sesión manualmente. En <strong>Perfil</strong> encontrarás tu resumen semanal y mensual, si quieres consultarlo.',
      appStore: 'Descargar en App Store',
    },
    subscription: {
      thankYouHeader: (name) => `Gracias, ${name}`,
      renewalHeader: (name) => `Gracias por seguir, ${name}`,
      receiptTitle: 'Confirmación de compra',
      receiptTitleRenewal: 'Detalle del cobro',
      thankYouSubject: (app, plan) => `${app}: suscripción activada (plan ${plan})`,
      thankYouSubjectReceipt: (app, plan) => `${app}: confirmación de compra (plan ${plan})`,
      renewalSubject: (app, plan) => `${app}: otro periodo contigo (plan ${plan})`,
      thankYouPreheader: (app, plan) => `Suscripción activada en ${app}. Plan ${plan}. Abre la app cuando quieras.`,
      thankYouPreheaderReceipt: (app, plan) =>
        `Confirmación de compra en ${app}. Plan ${plan}. Abre la app desde este correo.`,
      renewalPreheader: (app, plan) =>
        `Tu suscripción en ${app} se renovó. Plan ${plan}. Detalles del pago abajo.`,
      thankYouBody: (app, plan) =>
        `Tu suscripción <strong>Premium</strong> (plan <strong>${plan}</strong>) quedó activa. Gracias por confiar en <strong>${app}</strong>.`,
      syncNote:
        'Si acabas de pagar y la app aún no muestra Premium, <strong>cierra la app por completo</strong> y vuelve a entrar; a veces la tienda tarda unos minutos en sincronizar.',
      validityTitle: 'Vigencia actual',
      validityBody: (date) =>
        `La suscripción asociada a esta compra está vigente hasta el <strong>${date}</strong>. La fecha exacta de renovación también la puedes revisar en la app con tu sesión iniciada.`,
      renewalBody: (app, plan) =>
        `Se procesó la <strong>renovación</strong> de tu suscripción <strong>Premium</strong> (plan <strong>${plan}</strong>). Gracias por seguir un periodo más con <strong>${app}</strong>.`,
      renewalValidityBody: (date) =>
        `Tu acceso Premium queda vigente hasta el <strong>${date}</strong>. Si la app no refleja la fecha al instante, cierra la app por completo y vuelve a entrar.`,
      featuresTitle: 'Qué incluye Premium',
      featureBullets: [
        'Chat y herramientas sin los topes del periodo de prueba gratuito.',
        'Escalas y recursos de autoevaluación disponibles en la app, cuando correspondan a tu perfil.',
        'Seguimiento de actividad y continuidad en tu proceso, a tu ritmo.',
        'El detalle de funciones puede actualizarse; lo definitivo lo ves en la tienda y dentro de la app.',
      ],
      table: {
        date: 'Fecha',
        product: 'Producto',
        amount: 'Importe',
        provider: 'Pago procesado por',
        reference: 'Referencia',
        validUntil: 'Vigencia hasta',
      },
      productLine: (plan) => `Suscripción premium — plan ${plan}`,
      receiptNote:
        'Puedes conservar este correo como comprobante. Para facturación o soporte, indica la referencia y el correo de tu cuenta.',
      linkFallback:
        'Si el enlace no abre la app, ábrela manualmente e inicia sesión con esta cuenta.',
      supportNote:
        'Dudas sobre tu suscripción: canales enlazados al pie (Instagram). Este mensaje es automático.',
      renewalSupportNote:
        'Dudas sobre tu suscripción o este cobro: canales enlazados al pie (Instagram). Indica la referencia del comprobante. Este mensaje es automático.',
    },
    planLabels: {
      monthly: 'Mensual',
      quarterly: 'Trimestral',
      semestral: 'Semestral',
      yearly: 'Anual',
    },
  },
  en: {
    defaultUser: 'User',
    footer: {
      weeklyReply:
        'Questions about the trial extension? You can reply to this email with the address you use to sign in to the app. For other inquiries, we recommend Instagram (link above).<br>',
      noReply: 'This is an automated email; please do not reply to this message.<br>',
      instagramHint: 'Quick feedback, updates, and support.',
      rights: 'All rights reserved.',
    },
    verification: {
      subject: `Verification Code - ${APP_NAME_FULL}`,
      preheader: `Your code to restore access in ${APP_NAME}.`,
      header: 'Verification code',
      intro: 'Use this code to recover your password:',
      expires: 'This code expires in',
      minutes: 'minutes',
      ignore: 'If you did not request this code, you can ignore this email.',
    },
    emailVerification: {
      subject: `Verify your Email - ${APP_NAME_FULL}`,
      preheader: `Code to verify your email in ${APP_NAME}.`,
      header: 'Verify your email',
      intro: (user) => `Hello, ${user}. To complete registration, enter this code:`,
      ignore: 'If you did not create this account, you can ignore this email.',
    },
    resetPassword: {
      subject: `Reset Password - ${APP_NAME_FULL}`,
      preheader: `Link to reset your password in ${APP_NAME}.`,
      header: 'Reset password',
      intro: 'You requested a password reset. Tap the button to continue:',
      expiresHours: (n) => `This link expires in ${n} hour${n > 1 ? 's' : ''}.`,
      ignore: 'If you did not request a password reset, ignore this email.',
    },
    welcome: {
      subject: `Welcome to ${APP_NAME}`,
      header: (name) => `Welcome, ${name}`,
      preheader: (user) =>
        user
          ? `Thanks for signing up, ${user}. Open ${APP_NAME} and see a few first steps in this email.`
          : `Thanks for signing up to ${APP_NAME}. Open the app and see a few first steps in this email.`,
      body1: (app) =>
        `Thanks for signing up. <strong>${app}</strong> is a space to talk calmly, sort what you feel, and—if it fits—use tasks, habits, or reminders without a fixed obligation.`,
      stepsTitle: 'First steps',
      step1: '<strong>Open chat</strong> and write naturally: you do not need a “big topic” to start.',
      step2:
        '<strong>Tasks, habits, and pomodoros</strong> from chat when they fit: support for daily life, not an obligation.',
      step3:
        '<strong>Weekly and monthly summary</strong> in Profile gives perspective on your activity when you want to look back without pressure.',
      step4:
        'If tone or suggestions do not fit, <strong>correct or change the topic</strong>: the conversation goes at your pace.',
      linkFallback:
        'If the link does not open the app, open it manually and sign in with this account.',
      closing: (app) =>
        `Questions or feedback: reach us through the channels linked below (Instagram). This message is automated; to talk with ${app}, use the app.`,
    },
    reEngagement: {
      subject: (app) => `It has been a while since you opened ${app}`,
      header: (name) => `Hello, ${name}`,
      preheader: (d, app) =>
        `${d} day${d !== 1 ? 's' : ''} without activity in ${app}. A gentle reminder: you can open the app whenever it feels right.`,
      body: (d, app) =>
        `It has been <strong>${d}</strong> day${d !== 1 ? 's' : ''} since we saw activity on your account. That is okay: rhythms change. If you like, <strong>${app}</strong> is still here when you want to return.`,
      tipsTitle: 'An idea to pick up again',
      linkFallback:
        'If the link does not open the app, open it manually and sign in with your account.',
      closing: (app) =>
        `Thank you for trying ${app}. Questions or feedback: channels linked in the footer (Instagram). This message is automated.`,
      tips: [
        'Write naturally how you feel today: you do not need a big topic to start again.',
        'Ask for a short relaxation or mindfulness guide when you need to lower the intensity of the day.',
        'Reflect calmly on emotions and thoughts; sorting what is on your mind already helps.',
        'Set a small, realistic goal for today; celebrating modest progress counts too.',
        'If looking back helps, review earlier conversations with the same account.',
      ],
      noChargeNote:
        'Opening this email or the app <strong>does not charge you extra</strong>: your account stays the same until you choose to subscribe, if you ever do.',
      tipsHint:
        'General suggestion from a rotating list; it is not tied to your recent activity in the app.',
      appActionsTitle: 'What you can do in the app',
      appActions: [
        'Chat when you need it, without a schedule.',
        'Tasks, habits, and reminders if they fit your day.',
        'Activity summary in Profile when you want perspective, without pressure.',
      ],
    },
    trialRetention: {
      subject: (app) => `Your trial in ${app} ends soon`,
      header: (name) => `Hello, ${name}`,
      sectionEnding: 'Trial ending soon',
      bodyIntro: (app) =>
        `Your free period is to get to know <strong>${app}</strong> calmly.`,
      preheader: (app, fewHours, hoursLeft, daysApprox) => {
        if (fewHours) {
          return daysApprox != null
            ? `You have a few trial hours left (about ${daysApprox} day${daysApprox !== 1 ? 's' : ''}) in ${app}. You can view Premium plans or open your summary from this email.`
            : `You have a few trial hours left in ${app}. You can view Premium plans or open your summary from this email.`;
        }
        return daysApprox != null
          ? `You have about ${hoursLeft} trial hours left (about ${daysApprox} day${daysApprox !== 1 ? 's' : ''}) in ${app}. You can view Premium plans or open your summary from this email.`
          : `You have about ${hoursLeft} trial hours left in ${app}. You can view Premium plans or open your summary from this email.`;
      },
      timeBodyHtml: (fewHours, hoursLeft, daysApprox) => {
        const daysPart =
          daysApprox != null
            ? `, about <strong>${daysApprox}</strong> day${daysApprox !== 1 ? 's' : ''} as a rough guide`
            : '';
        const premium =
          ' If it helps, you can move to <strong>Premium</strong> and keep full access when the trial ends, with no pressure to decide right now.';
        if (fewHours) {
          return `You have <strong style="color:inherit;">a few hours</strong> of trial left${daysPart}.${premium}`;
        }
        return `You have about <strong style="color:inherit;">${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}</strong> of trial left${daysPart}.${premium}`;
      },
      premiumTitle: 'With Premium you keep',
      premiumBullets: [
        'Chat and tools without trial limits.',
        'Activity summary and continuity in your process.',
        'The same space, at the pace you choose.',
      ],
      endDateLabel: 'Approximate end date:',
      endDateNote: ' Exact details are in the app with your session signed in.',
      linkFallback: (app) =>
        `If the link does not open the app, open it manually and sign in; check subscription or payments inside ${app}.`,
      closing: (app) =>
        `Thank you for trying ${app}. Questions or feedback: channels linked in the footer (Instagram). This message is automated.`,
    },
    weeklyTips: {
      subject: (app, week) => `${app} weekly tip — Week ${week}`,
      preheader: (app, week) => `A brief wellbeing idea and ${app} (week ${week}).`,
      header: (week) => `Weekly tip — Week ${week}`,
      intro: (user) => `Hello, ${user}. This week we share a simple reminder.`,
      tryInChat: 'Try in chat:',
      wellbeing:
        'Emotional wellbeing is a process; every small step counts. The app is available whenever you want to return.',
      linkFallback:
        'If the link does not open the app, open it manually and sign in with your account.',
      tips: [
        {
          title: '🌱 Practice Gratitude',
          content:
            'Each day, before sleep, write 3 things you are grateful for. This helps train your mind to focus on the positive.',
          action: `Ask ${APP_NAME}: "How can I practice gratitude daily?"`,
        },
        {
          title: '🧘 4-7-8 Breathing',
          content:
            'Inhale for 4 seconds, hold for 7, exhale for 8. Repeat 4 times. This technique can reduce anxiety and improve sleep.',
          action: `Ask ${APP_NAME}: "Teach me breathing exercises to relax"`,
        },
        {
          title: '💭 Emotion Journal',
          content:
            'Write how you feel each day. Identifying your emotions is the first step to managing them better.',
          action: `Ask ${APP_NAME}: "How can I keep an emotion journal?"`,
        },
        {
          title: '🌿 Five-Minute Mindfulness',
          content:
            'Spend 5 minutes a day being present. Notice your breath, sounds around you, and body sensations.',
          action: `Ask ${APP_NAME}: "Guide me through a 5-minute meditation"`,
        },
        {
          title: '🤝 Self-Compassion',
          content:
            'Treat yourself with the same kindness you would show a good friend. It is okay not to feel okay all the time.',
          action: `Ask ${APP_NAME}: "How can I practice self-compassion?"`,
        },
        {
          title: '🎯 Small Goals',
          content:
            'Set small, achievable goals. Celebrating modest progress builds confidence and motivation.',
          action: `Ask ${APP_NAME}: "Help me set realistic wellbeing goals"`,
        },
        {
          title: '🌙 Sleep Hygiene',
          content:
            'Keep a regular sleep schedule. Avoid screens 1 hour before bed and create a calming routine.',
          action: `Ask ${APP_NAME}: "How can I improve my sleep quality?"`,
        },
      ],
    },
    weeklySummary: {
      header: 'A note from Anto',
      greeting: (name) => (name ? `Hi, <strong>${name}</strong> 👋` : 'Hi there 👋'),
      greetingPlain: 'Hello',
      highlight: 'Version 1.5.0',
      linkFallback:
        'If the link does not open the app, sign in manually. In <strong>Profile</strong> you will find your weekly and monthly summaries if you want to look back.',
      appStore: 'Download on the App Store',
    },
    subscription: {
      thankYouHeader: (name) => `Thank you, ${name}`,
      renewalHeader: (name) => `Thanks for staying, ${name}`,
      receiptTitle: 'Purchase confirmation',
      receiptTitleRenewal: 'Payment details',
      thankYouSubject: (app, plan) => `${app}: subscription activated (${plan} plan)`,
      thankYouSubjectReceipt: (app, plan) => `${app}: purchase confirmation (${plan} plan)`,
      renewalSubject: (app, plan) => `${app}: another period with you (${plan} plan)`,
      thankYouPreheader: (app, plan) =>
        `Subscription activated in ${app}. Plan ${plan}. Open the app whenever you like.`,
      thankYouPreheaderReceipt: (app, plan) =>
        `Purchase confirmation in ${app}. Plan ${plan}. Open the app from this email.`,
      renewalPreheader: (app, plan) =>
        `Your subscription in ${app} renewed. Plan ${plan}. Payment details below.`,
      thankYouBody: (app, plan) =>
        `Your <strong>Premium</strong> subscription (<strong>${plan}</strong> plan) is active. Thank you for trusting <strong>${app}</strong>.`,
      syncNote:
        'If you just paid and the app does not show Premium yet, <strong>fully close the app</strong> and open it again; stores sometimes take a few minutes to sync.',
      validityTitle: 'Current validity',
      validityBody: (date) =>
        `The subscription for this purchase is valid until <strong>${date}</strong>. You can also check the exact renewal date in the app when signed in.`,
      renewalBody: (app, plan) =>
        `Your <strong>Premium</strong> subscription (<strong>${plan}</strong> plan) <strong>renewed</strong>. Thank you for another period with <strong>${app}</strong>.`,
      renewalValidityBody: (date) =>
        `Your Premium access is valid until <strong>${date}</strong>. If the app does not show the date right away, fully close the app and open it again.`,
      featuresTitle: 'What Premium includes',
      featureBullets: [
        'Chat and tools without free-trial limits.',
        'Scales and self-assessment resources in the app when they apply to your profile.',
        'Activity tracking and continuity in your process, at your pace.',
        'Feature details may change; see the store and the app for the latest.',
      ],
      table: {
        date: 'Date',
        product: 'Product',
        amount: 'Amount',
        provider: 'Payment processed by',
        reference: 'Reference',
        validUntil: 'Valid until',
      },
      productLine: (plan) => `Premium subscription — ${plan} plan`,
      receiptNote:
        'You can keep this email as proof of purchase. For billing or support, include the reference and your account email.',
      linkFallback:
        'If the link does not open the app, open it manually and sign in with this account.',
      supportNote:
        'Questions about your subscription: channels linked in the footer (Instagram). This message is automated.',
      renewalSupportNote:
        'Questions about your subscription or this charge: channels in the footer (Instagram). Include the receipt reference. This message is automated.',
    },
    planLabels: {
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      semestral: 'Semiannual',
      yearly: 'Annual',
    },
  },
};

/** @param {string} plan @param {string} [language] */
export function subscriptionPlanDisplayName(plan, language = 'es') {
  const labels = getMailerStrings(language).planLabels;
  return labels[plan] != null ? labels[plan] : String(plan ?? '');
}

/** @param {string} [language] */
export function getMailerStrings(language = 'es') {
  const lang = normalizeEmailLanguage(language);
  return STRINGS[lang];
}

/** @param {string} [language] */
export function getEmailCtaForLang(language = 'es') {
  return normalizeEmailLanguage(language) === 'en' ? emailCtaLabelEn : emailCtaLabel;
}

/** @param {string} [language] */
export function getDisclaimerPlainForLang(language = 'es') {
  return normalizeEmailLanguage(language) === 'en'
    ? getEmailLegalMedicalDisclaimerPlainEn()
    : getEmailLegalMedicalDisclaimerPlain();
}
