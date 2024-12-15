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
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messageCounter, setMessageCounter] = useState(0); // Contador para IDs únicos

  const generateTempId = () => {
    setMessageCounter(prev => prev + 1);
    return `temp-${Date.now()}-${messageCounter}`;
  };

  const handleSend = async () => {
    if (input.trim() === '') return;

    setIsTyping(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch('http://localhost:5001/api/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: input })
      });

      if (!response.ok) {
        throw new Error('Error al enviar mensaje');
      }

      const newMessages = await response.json();
      // Asegurarse de que cada mensaje tenga un ID único
      const messagesWithIds = newMessages.map(msg => ({
        ...msg,
        _id: msg._id || generateTempId()
      }));
      
      setMessages(prev => [...prev, ...messagesWithIds]);
      setInput('');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudo enviar el mensaje');
    } finally {
      setIsTyping(false);
    }
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
        keyExtractor={item => item._id || generateTempId()} // Usar ID de MongoDB o generar uno temporal
        contentContainerStyle={styles.messagesContainer}
        inverted={false}
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
        <TouchableOpacity 
          style={styles.sendButton} 
          onPress={handleSend}
          disabled={isTyping}
        >
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
