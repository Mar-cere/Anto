import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useEmergencyAlertsHistoryStyles } from './emergencyAlertsHistoryStyles';
import {
  createRiskColors,
  createStatusColors,
  useEmergencyAlertsHistoryTexts,
} from './emergencyAlertsHistoryConstants';

const WHATSAPP_BRAND_GREEN = '#25D366';

export function HistoryItem({ item, formatDate }) {
  const { colors } = useTheme();
  const styles = useEmergencyAlertsHistoryStyles();
  const TEXTS = useEmergencyAlertsHistoryTexts();
  const statusColors = useMemo(() => createStatusColors(colors), [colors]);
  const riskColors = useMemo(() => createRiskColors(colors), [colors]);
  if (item == null || typeof item !== 'object') return null;

  const fmt =
    typeof formatDate === 'function' ? formatDate : () => TEXTS.DATE_UNAVAILABLE;

  const statusKey =
    typeof item.status === 'string' && item.status ? item.status.toLowerCase() : 'sent';
  const riskKey = item.riskLevel === 'HIGH' || item.riskLevel === 'MEDIUM' ? item.riskLevel : 'MEDIUM';

  return (
    <View style={styles.historyItem}>
      <View style={styles.historyItemHeader}>
        <View style={styles.historyItemLeft}>
          <MaterialCommunityIcons
            name={item.isTest ? 'test-tube' : 'alert-circle'}
            size={20}
            color={item.isTest ? colors.primary : riskColors[riskKey]}
          />
          <View style={styles.historyItemInfo}>
            <Text style={styles.historyItemContact}>
              {item.contact?.name != null && String(item.contact.name).trim() !== ''
                ? String(item.contact.name)
                : TEXTS.CONTACT}
            </Text>
            <Text style={styles.historyItemDate}>{fmt(item.sentAt)}</Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColors[statusKey] || statusColors.sent },
          ]}
        >
          <Text style={styles.statusBadgeText}>
            {typeof item.status === 'string' && TEXTS[item.status.toUpperCase()]
              ? TEXTS[item.status.toUpperCase()]
              : typeof item.status === 'string'
                ? item.status
                : TEXTS.SENT}
          </Text>
        </View>
      </View>
      <View style={styles.historyItemDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{TEXTS.RISK_LEVEL}:</Text>
          <View style={[styles.riskBadge, { backgroundColor: riskColors[riskKey] }]}>
            <Text style={styles.riskBadgeText}>{TEXTS[riskKey]}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{TEXTS.CHANNELS}:</Text>
          <View style={styles.channelsRow}>
            {item.channels?.email?.sent && (
              <View style={styles.channelBadge}>
                <MaterialCommunityIcons name="email" size={14} color={colors.info} />
                <Text style={styles.channelText}>{TEXTS.EMAIL}</Text>
              </View>
            )}
            {item.channels?.whatsapp?.sent && (
              <View style={styles.channelBadge}>
                <MaterialCommunityIcons name="whatsapp" size={14} color={WHATSAPP_BRAND_GREEN} />
                <Text style={styles.channelText}>{TEXTS.WHATSAPP}</Text>
              </View>
            )}
            {!item.channels?.email?.sent && !item.channels?.whatsapp?.sent && (
              <Text style={styles.noChannelsText}>{TEXTS.NO_CHANNELS}</Text>
            )}
          </View>
        </View>
        {item.isTest && (
          <View style={styles.testBadge}>
            <Text style={styles.testBadgeText}>{TEXTS.TEST_ALERT}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
