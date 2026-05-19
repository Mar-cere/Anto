// Frequently asked questions organized by category
const faqDataEn = [
  {
    category: 'About the App',
    items: [
      {
        question: 'What is Anto?',
        answer:
          'Anto is a digital assistant for emotional support and wellbeing. It uses artificial intelligence to provide conversational support, as well as tools for tasks, habits, and therapeutic techniques. It does not replace mental health professionals.',
      },
      {
        question: 'How can I get the most out of the app?',
        answer:
          'To get the most out of Anto, we suggest:\n1) Chat with Anto regularly to receive personalized emotional support.\n2) Use habits and tasks to stay organized.\n3) Explore interactive therapeutic techniques (breathing, mindfulness, grounding, etc.).\n4) Check your crisis dashboard to understand emotional patterns.\n5) Set up emergency contacts for your safety.\n6) Review your therapeutic techniques statistics to track your progress.',
      },
      {
        question: 'Can I use Anto offline?',
        answer:
          'Some features, like habits and tasks tracking, are available offline. However, chat with Anto requires internet access because the AI needs to connect to servers to generate real-time responses. Interactive therapeutic techniques also work better with internet to save progress.',
      },
    ],
  },
  {
    category: 'Chat with Anto',
    items: [
      {
        question: 'How does chat with Anto work?',
        answer:
          'Chat with Anto allows you to talk about how you feel, ask for guidance, and receive personalized support. Anto uses AI to better understand message context and respond in a useful way. If risk signs are detected, it can suggest support actions and display safety options.',
      },
      {
        question: 'Can Anto replace a psychologist?',
        answer:
          'Anto is an AI-based emotional support tool, but it does not replace a mental health professional. Its goal is to support your daily wellbeing, provide therapeutic techniques, and detect crisis situations. If you need professional help, Anto can suggest when to seek a specialist and can trigger emergency alerts if it detects a critical situation.',
      },
      {
        question: 'Is chat with Anto private and secure?',
        answer:
          'Yes. We protect your conversations with security measures and encryption in transit and at rest. To generate responses, part of the chat content and the minimum required context are processed by our third-party AI provider. You can read more in the Privacy Policy.',
      },
      {
        question: 'How does crisis detection work?',
        answer:
          'Anto analyzes your messages to detect possible signs of emotional crisis. When risk is identified, it can suggest regulation techniques, show support recommendations, and, if you have emergency contacts configured, trigger alerts according to available settings.',
      },
    ],
  },
  {
    category: 'Features',
    items: [
      {
        question: 'How can I manage my habits?',
        answer:
          "Go to the Habits section from the Dashboard and tap '+' to add a new one. You can customize frequency (daily, weekly, etc.), set reminders, and track progress with clear charts. You can also edit, archive, or delete habits at any time. Habits help you build positive routines and improve wellbeing.",
      },
      {
        question: 'How does the tasks system work?',
        answer:
          'The tasks system helps you organize daily activities. You can create tasks, set priorities, add due dates, and mark them as completed. Pending tasks appear on your Dashboard so you do not forget anything important. You can also review completed tasks to celebrate your progress.',
      },
      {
        question: 'Which therapeutic techniques are available?',
        answer:
          'Anto includes multiple evidence-based interactive therapeutic techniques:\n- Breathing exercises to regulate anxiety\n- Grounding 5-4-3-2-1 technique to reconnect with the present\n- Mindfulness for present-moment awareness\n- Gratitude Journal to cultivate positivity\n- Self-compassion to work on self-acceptance\n- Communication tools to improve relationships\n- And many more. You can access them from the Dashboard or when Anto suggests them during a conversation.',
      },
      {
        question: 'What is the Crisis Dashboard?',
        answer:
          'The Crisis Dashboard lets you view emotional history, identify crisis patterns, see trends over time, and review detailed statistics. It helps you better understand emotional states and take preventive action. You can access it from the app main menu.',
      },
      {
        question: 'How does the Pomodoro timer work?',
        answer:
          'The Pomodoro timer helps improve productivity and wellbeing through 25-minute focused work sessions followed by short breaks. You can use it to better manage your time, reduce stress, and maintain a healthier balance between work and rest.',
      },
      {
        question: 'Is Anto available in multiple languages?',
        answer:
          'Anto is currently available in Spanish and English. We are working to add more languages in future updates.',
      },
    ],
  },
  {
    category: 'Subscriptions and Payments',
    items: [
      {
        question: 'Is there a trial period?',
        answer:
          'Yes. Anto offers a free 3-day trial so you can explore all features without commitment. During this period you have full access to all app capabilities.',
      },
      {
        question: 'How do payments work?',
        answer:
          'Payments are securely processed through Mercado Pago. You can manage your subscription, view transaction history, and update your payment method from the Subscription section in Settings. All payments are protected with high-level encryption.',
      },
      {
        question: 'Can I cancel my subscription anytime?',
        answer:
          'Yes. You can cancel your subscription at any time from Settings > Subscription. Cancellation takes effect at the end of the current billing period, and you keep access until then.',
      },
    ],
  },
  {
    category: 'Emergency System',
    items: [
      {
        question: 'How do emergency alerts work?',
        answer:
          'You can configure emergency contacts in Settings > Emergency Contacts. When Anto detects a high-risk crisis situation, it can automatically send alerts to those contacts (via SMS or WhatsApp) so they can support you. You keep full control over when and how these alerts are activated.',
      },
      {
        question: 'Can I review my alert history?',
        answer:
          'Yes. You can see your full emergency alert history, including when alerts were sent, to whom, and each alert status, from the Alerts History section in the Crisis Dashboard.',
      },
    ],
  },
  {
    category: 'Privacy and Security',
    items: [
      {
        question: 'Is my data protected?',
        answer:
          'Yes, we use encryption and security controls to protect your information. Some data needed for chat operation is processed with external providers (for example, the AI provider used to generate responses). We detail what is shared and with whom in the Privacy Policy.',
      },
      {
        question: 'Can I download my data?',
        answer:
          'Yes. You can export all your information from Settings > Personal Data > Export Data. This includes conversations, habits, tasks, statistics, and any other information you shared with the app.',
      },
    ],
  },
  {
    category: 'Future Improvements and Suggestions',
    items: [
      {
        question: 'What new features are in development?',
        answer:
          'We are constantly improving Anto. Some features we are considering include:\n- Significant improvements in Anto chat technology for even more personalized responses\n- Better crisis detection with more advanced algorithms\n- Dark mode for a better visual experience\n- Internationalization (more languages)\n- Wearables integration (Apple Watch, Fitbit)\n- More specialized therapeutic techniques\n- Integration with mental health professionals',
      },
      {
        question: 'Where can I suggest improvements for Anto?',
        answer:
          'You can send ideas from Settings > Help > Suggestions or contact Anto directly through chat. We value user feedback to keep improving the app and make it more useful for everyone.',
      },
    ],
  },
];

export default faqDataEn;
