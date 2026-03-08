import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './emergencyAlertsHistoryStyles';
import { TEXTS, STATUS_COLORS, RISK_COLORS } from './emergencyAlertsHistoryConstants';

export function HistoryItem({ item, formatDate }) {
  const statusKey = item.status?.toLowerCase() || 'sent';
  const riskKey = item.riskLevel || 'MEDIUM';

  return (
    <View style={styles.historyItem}>
      <View style={styles.historyItemHeader}>
        <View style={styles.historyItemLeft}>
          <MaterialCommunityIcons
            name={item.isTest ? 'test-tube' : 'alert-circle'}
            size={20}
            color={item.isTest ? '#1ADDDB' : RISK_COLORS[riskKey]}
          />
          <View style={styles.historyItemInfo}>
            <Text style={styles.historyItemContact}>{item.contact?.name}</Text>
            <Text style={styles.historyItemDate}>{formatDate(item.sentAt)}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[statusKey] }]}>
          <Text style={styles.statusBadgeText}>{TEXTS[item.status?.toUpperCase()] || item.status}</Text>
        </View>
      </View>
      <View style={styles.historyItemDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{TEXTS.RISK_LEVEL}:</Text>
          <View style={[styles.riskBadge, { backgroundColor: RISK_COLORS[riskKey] }]}>
            <Text style={styles.riskBadgeText}>{TEXTS[riskKey]}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{TEXTS.CHANNELS}:</Text>
          <View style={styles.channelsRow}>
            {item.channels?.email?.sent && (
              <View style={styles.channelBadge}>
                <MaterialCommunityIcons name="email" size={14} color="#4ECDC4" />
                <Text style={styles.channelText}>{TEXTS.EMAIL}</Text>
              </View>
            )}
            {item.channels?.whatsapp?.sent && (
              <View style={styles.channelBadge}>
                <MaterialCommunityIcons name="whatsapp" size={14} color="#25D366" />
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
