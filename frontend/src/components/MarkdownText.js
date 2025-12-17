/**
 * Componente para renderizar texto con markdown básico
 * Soporta: **texto** para negrita
 */

import React from 'react';
import { Text } from 'react-native';

/**
 * Parsea texto con markdown básico y devuelve un array de objetos con texto y estilos
 * @param {string} text - Texto con markdown
 * @returns {Array} Array de objetos {text, isBold}
 */
const parseMarkdown = (text) => {
  if (!text || typeof text !== 'string') {
    return [{ text: '', isBold: false }];
  }

  // Si no hay markdown, devolver el texto original
  if (!text.includes('**')) {
    return [{ text, isBold: false }];
  }

  // Patrón para encontrar **texto** (negrita)
  const boldPattern = /\*\*(.+?)\*\*/g;
  const parts = [];
  let lastIndex = 0;

  let match;
  while ((match = boldPattern.exec(text)) !== null) {
    // Agregar texto antes del match
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index);
      if (beforeText) {
        parts.push({ text: beforeText, isBold: false });
      }
    }

    // Agregar texto en negrita
    const boldText = match[1];
    parts.push({ text: boldText, isBold: true });

    lastIndex = match.index + match[0].length;
  }

  // Agregar texto restante después del último match
  if (lastIndex < text.length) {
    const afterText = text.substring(lastIndex);
    if (afterText) {
      parts.push({ text: afterText, isBold: false });
    }
  }

  return parts.length > 0 ? parts : [{ text, isBold: false }];
};

/**
 * Componente MarkdownText
 * Renderiza texto con soporte para markdown básico
 */
const MarkdownText = ({ 
  children, 
  style, 
  boldStyle,
  ...props 
}) => {
  const text = typeof children === 'string' ? children : String(children || '');
  const parsed = parseMarkdown(text);

  // Si solo hay un elemento sin negrita, renderizarlo directamente
  if (parsed.length === 1 && !parsed[0].isBold) {
    return (
      <Text style={style} {...props}>
        {parsed[0].text}
      </Text>
    );
  }

  // Si hay múltiples elementos o elementos en negrita, renderizarlos dentro de un Text contenedor
  return (
    <Text style={style} {...props}>
      {parsed.map((part, index) => (
        <Text 
          key={index} 
          style={part.isBold ? [style, boldStyle] : style}
        >
          {part.text}
        </Text>
      ))}
    </Text>
  );
};

export default MarkdownText;


