import React from 'react';
import renderer, { act } from 'react-test-renderer';
import AbcMacroCycleVisual from '../AbcMacroCycleVisual';

global.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return { MaterialCommunityIcons: () => React.createElement('Icon') };
});

jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#3366cc',
      text: '#111',
      textSecondary: '#666',
      border: '#ddd',
      glassFill: 'rgba(0,0,0,0.05)',
      primarySoft: 'rgba(51,102,204,0.12)',
    },
  }),
}));

jest.mock('../../../context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'es' }),
}));

jest.mock('react-native', () => {
  const React = require('react');
  const make = (name) => {
    const Comp = ({ children, onPress, ...props }) =>
      React.createElement(name, { ...props, onClick: onPress }, children);
    Comp.displayName = name;
    return Comp;
  };
  return {
    View: make('View'),
    Text: make('Text'),
    Pressable: make('Pressable'),
    StyleSheet: { create: (s) => s, hairlineWidth: 1 },
  };
});

describe('AbcMacroCycleVisual (#212)', () => {
  const cycle = {
    trigger: 'Reunión',
    thoughts: ['No voy a poder'],
    emotions: ['ansiedad'],
    consequences: ['Evité hablar'],
  };

  it('renderiza hint exploratorio en modo interactivo', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <AbcMacroCycleVisual cycle={cycle} interactive avgEmotionIntensity={7} />,
      );
    });
    const json = tree.toJSON();
    const flat = JSON.stringify(json);
    expect(flat).toMatch(/Toca cada letra/i);
    expect(flat).toMatch(/Intensidad media 7\/10/);
  });

  it('no muestra hint exploratorio en modo compacto no interactivo', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <AbcMacroCycleVisual cycle={cycle} compact interactive={false} />,
      );
    });
    const flat = JSON.stringify(tree.toJSON());
    expect(flat).not.toMatch(/Toca cada letra/i);
  });

  it('devuelve null sin ciclo válido', () => {
    let tree;
    act(() => {
      tree = renderer.create(<AbcMacroCycleVisual cycle={null} interactive />);
    });
    expect(tree.toJSON()).toBeNull();
  });

  it('al expandir pata B muestra pista de intervención', () => {
    let tree;
    act(() => {
      tree = renderer.create(<AbcMacroCycleVisual cycle={cycle} interactive />);
    });
    const pressables = tree.root.findAll(
      (node) => node.type === 'Pressable' && typeof node.props.onClick === 'function',
    );
    expect(pressables.length).toBeGreaterThanOrEqual(3);
    act(() => {
      pressables[1].props.onClick();
    });
    const flat = JSON.stringify(tree.toJSON());
    expect(flat).toMatch(/punto de intervención/i);
  });
});
