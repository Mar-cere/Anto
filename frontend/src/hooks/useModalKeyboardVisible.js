import { useEffect, useState } from 'react';
import { subscribeModalKeyboardVisibility } from '../utils/modalKeyboardUtils';

export function useModalKeyboardVisible() {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => subscribeModalKeyboardVisibility(setKeyboardVisible), []);

  return keyboardVisible;
}
