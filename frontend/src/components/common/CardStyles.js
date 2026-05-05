import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../styles/globalStyles';
import {
  FOCUS_PANEL,
  FOCUS_ICON_WRAP,
  FOCUS_CHEVRON_MUTED,
  FOCUS_BORDER_SUBTLE,
  FOCUS_ACCENT_BORDER,
  FOCUS_META,
  FOCUS_KICKER_COLOR,
} from '../../styles/focusCardTheme';

export const cardColors = {
  primary: '#1ADDDB',
  secondary: '#A3B8E8',
  background: 'rgba(255, 255, 255, 0.04)',
  cardBg: 'rgba(255, 255, 255, 0.03)',
  success: '#4CAF50',
  warning: '#FFD93D',
  error: '#FF6B6B',
  border: 'rgba(255, 255, 255, 0.1)',
};

export const commonStyles = StyleSheet.create({
  cardContainer: {
    ...FOCUS_PANEL,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  headerIconWrap: {
    ...FOCUS_ICON_WRAP,
  },
  title: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    flex: 1,
    minWidth: 0,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(26, 221, 219, 0.1)',
    flexShrink: 0,
  },
  viewAllText: {
    color: cardColors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  itemContainer: {
    backgroundColor: cardColors.cardBg,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  emptyText: {
    color: FOCUS_META,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(26, 221, 219, 0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_ACCENT_BORDER,
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: cardColors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  loader: {
    padding: 24,
  },
});

export const CardHeader = ({ icon, title, onViewAll }) => (
  <View style={commonStyles.cardHeader}>
    <View style={commonStyles.titleContainer}>
      <View style={commonStyles.headerIconWrap}>
        <MaterialCommunityIcons name={icon} size={20} color={cardColors.primary} />
      </View>
      <Text style={commonStyles.title} numberOfLines={2}>
        {title}
      </Text>
    </View>
    <TouchableOpacity style={commonStyles.viewAllButton} onPress={onViewAll} activeOpacity={0.7}>
      <Text style={commonStyles.viewAllText}>Ver todos</Text>
      <MaterialCommunityIcons name="chevron-right" size={18} color={FOCUS_CHEVRON_MUTED} />
    </TouchableOpacity>
  </View>
);

export const EmptyState = ({ icon, message, onAdd, addButtonText, compact = false, showIcon = true }) => (
  <View style={[commonStyles.emptyContainer, compact && compactStyles.emptyContainer]}>
    {showIcon ? (
      <MaterialCommunityIcons
        name={icon}
        size={compact ? 24 : 40}
        color={FOCUS_KICKER_COLOR}
      />
    ) : null}
    <Text style={[commonStyles.emptyText, compact && compactStyles.emptyText]}>{message}</Text>
    {onAdd && (
      <TouchableOpacity
        style={[commonStyles.addButton, compact && compactStyles.addButton]}
        onPress={onAdd}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="plus" size={compact ? 14 : 16} color={cardColors.primary} />
        <Text style={[commonStyles.addButtonText, compact && compactStyles.addButtonText]}>
          {addButtonText}
        </Text>
      </TouchableOpacity>
    )}
  </View>
);

const compactStyles = StyleSheet.create({
  emptyContainer: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  addButton: {
    marginTop: 6,
    paddingVertical: 9,
    borderRadius: 12,
    borderColor: 'rgba(26, 221, 219, 0.14)',
    backgroundColor: 'rgba(26, 221, 219, 0.06)',
  },
  addButtonText: {
    fontSize: 13,
  },
});
