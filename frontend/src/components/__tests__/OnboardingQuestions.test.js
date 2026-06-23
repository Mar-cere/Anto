import React from 'react';
import renderer, { act } from 'react-test-renderer';
import OnboardingQuestions from '../OnboardingQuestions';

global.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('react-native', () => {
  const React = require('react');
  const makeHost = (name) => {
    const Comp = ({ children, ...props }) => React.createElement(name, props, children);
    Comp.displayName = name;
    return Comp;
  };
  return {
    View: makeHost('View'),
    Text: makeHost('Text'),
    TextInput: makeHost('TextInput'),
    TouchableOpacity: makeHost('TouchableOpacity'),
    ScrollView: makeHost('ScrollView'),
    Modal: makeHost('Modal'),
    ActivityIndicator: makeHost('ActivityIndicator'),
    StyleSheet: { create: (s) => s, flatten: (x) => x },
    Platform: { OS: 'ios', select: (dict) => dict.ios }
  };
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return { MaterialCommunityIcons: ({ name }) => React.createElement('Icon', { name: name || 'icon' }) };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' }
}));

jest.mock('../../hooks/useTranslations', () => ({
  useSectionTranslations: () => ({}),
}));

jest.mock('../onboarding/OnboardingBrandShell', () => {
  const React = require('react');
  return ({ children, footer }) =>
    React.createElement('View', null, children, footer);
});

jest.mock('../onboarding/OnboardingBenefitList', () => {
  const React = require('react');
  return ({ items }) =>
    React.createElement('View', null, (items || []).map((item) => React.createElement('Text', { key: item }, item)));
});

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#1adddb',
      textOnPrimary: '#ffffff',
      text: '#ffffff',
      textSecondary: '#a3b8e8',
      textMuted: '#8fa8e8',
      error: '#c62828',
      modalSurface: '#122052',
      chromeCard: '#122052',
      surface: '#122052',
      background: '#0a1630',
      accentLine: 'rgba(30, 131, 211, 0.25)',
      accentLineSoft: 'rgba(30, 131, 211, 0.12)',
      border: 'rgba(163, 184, 232, 0.25)',
      glassFill: 'rgba(255,255,255,0.03)',
    },
    resolvedScheme: 'dark',
  }),
}));

const mockPatch = jest.fn();
jest.mock('../../config/api', () => ({
  api: {
    patch: (...args) => mockPatch(...args)
  },
  ENDPOINTS: {
    ONBOARDING_PREFERENCES: '/api/users/me/onboarding-preferences'
  }
}));

const mockShowToast = jest.fn();
jest.mock('../../context/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast })
}));

jest.mock('../../utils/apiErrorHandler', () => ({
  getApiErrorMessage: (err) => err?.message || 'Error'
}));

describe('OnboardingQuestions (UI)', () => {
  const getNodeText = (node) => {
    if (node == null) return '';
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(getNodeText).join('');
    return getNodeText(node.children || []);
  };

  const pressByText = (root, label) => {
    const touchables = root.findAll((node) => node.type === 'TouchableOpacity');
    const target = touchables.find((node) => getNodeText(node).includes(label));
    if (!target) throw new Error(`No se encontró botón con texto: ${label}`);
    target.props.onPress?.();
  };

  const createTree = async (element) => {
    let tree;
    await act(async () => {
      tree = renderer.create(element);
    });
    return tree;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPatch.mockResolvedValue({});
  });

  it('no renderiza nada cuando visible=false', () => {
    return createTree(<OnboardingQuestions visible={false} onDismiss={jest.fn()} />).then((tree) => {
      expect(tree.toJSON()).toBeNull();
    });
  });

  it('omitir ejecuta onCompleted y luego onDismiss', async () => {
    const onCompleted = jest.fn().mockResolvedValue(undefined);
    const onDismiss = jest.fn();
    const tree = await createTree(
      <OnboardingQuestions
        visible
        onCompleted={onCompleted}
        onDismiss={onDismiss}
      />
    );

    await act(async () => {
      pressByText(tree.root, 'Omitir');
      await Promise.resolve();
    });

    expect(onCompleted).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('si onCompleted falla en omitir, igual ejecuta onDismiss', async () => {
    const onCompleted = jest.fn().mockRejectedValue(new Error('storage failed'));
    const onDismiss = jest.fn();
    const tree = await createTree(
      <OnboardingQuestions
        visible
        onCompleted={onCompleted}
        onDismiss={onDismiss}
      />
    );

    await act(async () => {
      pressByText(tree.root, 'Omitir');
      await Promise.resolve();
    });

    expect(onCompleted).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('ver recorrido ejecuta onCompleted y abre flujo opcional', async () => {
    const onCompleted = jest.fn().mockResolvedValue(undefined);
    const onExploreApp = jest.fn();
    const tree = await createTree(
      <OnboardingQuestions
        visible
        onCompleted={onCompleted}
        onExploreApp={onExploreApp}
        onDismiss={jest.fn()}
      />
    );

    await act(async () => {
      pressByText(tree.root, 'Repasar recorrido');
      await Promise.resolve();
    });

    expect(onCompleted).toHaveBeenCalledTimes(1);
    expect(onExploreApp).toHaveBeenCalledTimes(1);
  });

  it('al enviar con opción persiste en onboarding-preferences', async () => {
    const onCompleted = jest.fn().mockResolvedValue(undefined);
    const onDismiss = jest.fn();
    const tree = await createTree(
      <OnboardingQuestions visible onCompleted={onCompleted} onDismiss={onDismiss} />,
    );

    await act(async () => {
      pressByText(tree.root, 'Apoyo emocional');
    });
    await act(async () => {
      pressByText(tree.root, 'Empezar con Anto');
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockPatch).toHaveBeenCalledWith('/api/users/me/onboarding-preferences', {
      whatExpectFromApp: 'Apoyo emocional',
      whatToImproveOrWorkOn: null,
      typeOfSpecialist: null,
    });
    expect(mockShowToast).toHaveBeenCalled();
    expect(onCompleted).toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
  });

  it('al enviar sin respuestas no persiste y cierra flujo', async () => {
    const onCompleted = jest.fn().mockResolvedValue(undefined);
    const onDismiss = jest.fn();
    const tree = await createTree(
      <OnboardingQuestions
        visible
        onCompleted={onCompleted}
        onDismiss={onDismiss}
      />
    );

    await act(async () => {
      pressByText(tree.root, 'Empezar con Anto');
      await Promise.resolve();
    });

    expect(mockPatch).not.toHaveBeenCalled();
    expect(mockShowToast).not.toHaveBeenCalled();
    expect(onCompleted).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
