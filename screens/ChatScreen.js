import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);
  const typingDots = useRef(new Animated.Value(0)).current;

  // Inicializar mensajes con una respuesta proactiva
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ sender: 'AI', text: '¡Hola! ¿En qué puedo ayudarte hoy?' }]);
    }
  }, []);

  // Indicador de escritura interactivo (animación de puntos)
  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingDots, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(typingDots, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      typingDots.stopAnimation();
    }
  }, [isTyping]);

  // Scroll automático al final
  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleSend = async () => {
    if (input.trim() === '') return;

    const userMessage = { sender: 'User', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch('http://localhost:5001/api/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: input }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert('Error', 'Autenticación fallida. Por favor, inicia sesión.');
        } else if (response.status === 500) {
          Alert.alert('Error', 'Problema del servidor. Inténtalo más tarde.');
        } else {
          Alert.alert('Error', 'Algo salió mal. Inténtalo de nuevo.');
        }
        return;
      }

      const newMessages = await response.json();
      setMessages((prev) => [...prev, ...newMessages]);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudo enviar el mensaje. Verifica tu conexión.');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
      />

      {isTyping && (
        <View style={styles.typingIndicator}>
          <Animated.Text
            style={[
              styles.typingText,
              { opacity: typingDots.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
              },
            ]}
          >
            Anto está escribiendo...
          </Animated.Text>
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
    backgroundColor: '#1D1B70',
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
    marginVertical: 4,
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
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(163, 173, 219, 0.1)',
    borderRadius: 20,
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginLeft: 10,
  },
  typingText: {
    color: '#A3ADDB',
    fontSize: 14,
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
