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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);
  const typingAnimation = useRef(new Animated.Value(0)).current;

  // Animación del indicador de escritura
  useEffect(() => {
    if (isTyping) {
      Animated.sequence([
        Animated.timing(typingAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(typingAnimation, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (isTyping) {
          // Repetir la animación si aún está escribiendo
          typingAnimation.setValue(0);
        }
      });
    }
  }, [isTyping]);

  // Scroll automático a nuevos mensajes
  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const renderMessage = ({ item, index }) => {
    const isUser = item.sender === 'User';
    return (
      <Animated.View
        style={[
          styles.messageBubble,
          isUser ? styles.userMessage : styles.aiMessage,
          {
            opacity: new Animated.Value(1),
            transform: [{
              translateY: new Animated.Value(0)
            }]
          }
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
      </Animated.View>
    );
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
      setMessages(prev => [...prev, ...newMessages]);
      setInput('');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudo enviar el mensaje');
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
        keyExtractor={item => item._id}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
      />

      {isTyping && (
        <Animated.View 
          style={[
            styles.typingIndicator,
            {
              opacity: typingAnimation
            }
          ]}
        >
          <Text style={styles.typingText}>Anto está escribiendo...</Text>
        </Animated.View>
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
    marginVertical: 4,
    maxWidth: '75%',
    transform: [{ scale: 1 }],
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
