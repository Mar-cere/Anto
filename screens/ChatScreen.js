import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Animated,
  Vibration,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const ChatScreen = () => {
  const [messages, setMessages] = useState([
    { id: '1', text: '¡Hola! ¿Cómo estás?', sender: 'User' },
    { id: '2', text: '¡Hola! Estoy aquí para ayudarte. 😊', sender: 'AI' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (input.trim() === '') return;

    const userMessage = { id: Date.now().toString(), text: input, sender: 'User' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    setIsTyping(true);
    setTimeout(() => {
      const aiMessage = {
        id: Date.now().toString(),
        text: 'Esto es una respuesta automática.',
        sender: 'AI',
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'User';
    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userMessage : styles.aiMessage,
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
      />

      {isTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>Anto está escribiendo...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#A3ADDB"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D1B70', // Fondo consistente
    paddingHorizontal: width / 20,
    paddingVertical: height / 30,
  },
  messagesContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 15,
    marginVertical: 8,
    maxWidth: '75%',
  },
  userMessage: {
    backgroundColor: '#5127DB',
    alignSelf: 'flex-end',
    marginRight: 10,
  },
  aiMessage: {
    backgroundColor: '#A3ADDB',
    alignSelf: 'flex-start',
    marginLeft: 10,
  },
  messageText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  typingIndicator: {
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  typingText: {
    fontSize: 14,
    color: '#A3ADDB',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#A3ADDB',
    backgroundColor: '#1D1B70',
    marginTop: height / 60,
  },
  input: {
    flex: 1,
    padding: 10,
    backgroundColor: '#CECFDB',
    borderRadius: 25,
    color: '#1D1B70',
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#5127DB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});

export default ChatScreen;
