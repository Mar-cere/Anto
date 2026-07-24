import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { ROUTES } from '../../constants/routes';
import {
  buildCommitmentDisplayTitle,
  buildCommitmentFollowUpPrompt,
  buildCommitmentLinkHint,
} from '../../utils/commitmentDisplayCopy';
import { MAX_FOCUS_COMMITMENT_FOLLOW_UP_ATTEMPTS } from '../../utils/focusCardConstants';

/**
 * Lista de compromisos con seguimiento y renegociación en el home.
 */
export default function DashboardFocusCommitmentsSection({
  visibleCommitments,
  DASH,
  styles,
  chevronMuted,
  renegotiateId,
  renegotiateLabel,
  setRenegotiateId,
  setRenegotiateLabel,
  partialNoteId,
  partialNote,
  setPartialNoteId,
  setPartialNote,
  isCommitmentFollowUpDue,
  handleCommitmentAnswer,
  handleCommitmentOmit,
  handleCommitmentRenegotiate,
  handlePartialNoteSave,
  handleConv,
  onOpenChat,
}) {
  const navigation = useNavigation();

  if (visibleCommitments.length === 0) return null;

  return (
    <View style={styles.insetSection}>
      <View style={styles.commitmentSectionHeader}>
        <Text style={styles.commitmentSectionTitle || styles.insetLabel}>
          {DASH.FOCUS_COMMITMENTS}
        </Text>
        <Pressable
          onPress={() => navigation.navigate(ROUTES.SESSION_COMMITMENTS)}
          style={({ pressed }) => [styles.commitmentSeeAll, pressed && { opacity: 0.72 }]}
          accessibilityRole="button"
          accessibilityLabel={DASH.FOCUS_COMMITMENTS_SEE_ALL}
        >
          <Text style={styles.commitmentSeeAllText}>{DASH.FOCUS_COMMITMENTS_SEE_ALL}</Text>
        </Pressable>
      </View>
      {visibleCommitments.map((item, index) => {
        const commitmentTitle = buildCommitmentDisplayTitle(item, DASH);
        const followUpPrompt = buildCommitmentFollowUpPrompt(item, DASH);
        const linkHint = buildCommitmentLinkHint(item, DASH);
        const showFollowUp = isCommitmentFollowUpDue(item);
        // null = aún sin ack de nota; '' o texto = panel cerrado (salvo edición local).
        const showPartialPanel =
          item.status === 'active' &&
          item.followUpAnswer === 'partial' &&
          (partialNoteId === item.id || item.partialNote == null);
        const showRenegotiate =
          item.status === 'active' &&
          !showFollowUp &&
          !showPartialPanel &&
          (renegotiateId === item.id ||
            (item.followUpAnswer === 'no' &&
              Number(item.followUpAttempts || 0) >= 1 &&
              Number(item.followUpAttempts || 0) < MAX_FOCUS_COMMITMENT_FOLLOW_UP_ATTEMPTS));
        const conversationId = item.conversationId ? String(item.conversationId) : '';
        const canOpenConversation =
          !showFollowUp &&
          !showRenegotiate &&
          !showPartialPanel &&
          (Boolean(conversationId) || typeof onOpenChat === 'function');
        const isLastCommitment = index === visibleCommitments.length - 1;
        const openCommitment = () => {
          if (!canOpenConversation) return;
          if (conversationId) {
            handleConv(conversationId);
            return;
          }
          onOpenChat?.();
        };

        return (
          <Pressable
            key={item.id}
            style={({ pressed }) => [
              styles.commitmentRow,
              isLastCommitment && styles.commitmentRowLast,
              canOpenConversation && pressed && styles.commitmentRowPressed,
            ]}
            onPress={canOpenConversation ? openCommitment : undefined}
            disabled={!canOpenConversation}
            accessibilityRole={canOpenConversation ? 'button' : 'text'}
            accessibilityLabel={
              canOpenConversation
                ? `${commitmentTitle}. ${DASH.FOCUS_COMMITMENT_OPEN_A11Y}`
                : commitmentTitle
            }
          >
            <View style={styles.commitmentRowInner}>
              <View style={styles.commitmentRowCopy}>
                <Text style={styles.commitmentLabel} numberOfLines={2}>
                  {commitmentTitle}
                </Text>
                {linkHint ? <Text style={styles.commitmentLinkHint}>{linkHint}</Text> : null}
                {item.partialNote ? (
                  <Text style={styles.commitmentLinkHint} numberOfLines={2}>
                    {item.partialNote}
                  </Text>
                ) : null}
              </View>
              {canOpenConversation ? (
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={chevronMuted}
                  style={styles.commitmentChevron}
                />
              ) : null}
            </View>
            {showFollowUp ? (
              <View
                style={styles.commitmentActions}
                accessibilityRole="group"
                accessibilityLabel={`${commitmentTitle}. ${followUpPrompt}`}
              >
                <Text style={styles.commitmentPrompt}>{followUpPrompt}</Text>
                <View style={styles.commitmentButtons}>
                  <Pressable
                    onPress={() => handleCommitmentAnswer(item.id, 'yes')}
                    style={({ pressed }) => [styles.commitmentChip, pressed && { opacity: 0.88 }]}
                    accessibilityRole="button"
                    accessibilityLabel={DASH.FOCUS_COMMITMENT_YES}
                  >
                    <Text style={styles.commitmentChipText}>{DASH.FOCUS_COMMITMENT_YES}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleCommitmentAnswer(item.id, 'partial')}
                    style={({ pressed }) => [styles.commitmentChip, pressed && { opacity: 0.88 }]}
                    accessibilityRole="button"
                    accessibilityLabel={DASH.FOCUS_COMMITMENT_PARTIAL}
                  >
                    <Text style={styles.commitmentChipText}>{DASH.FOCUS_COMMITMENT_PARTIAL}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleCommitmentAnswer(item.id, 'no')}
                    style={({ pressed }) => [styles.commitmentChip, pressed && { opacity: 0.88 }]}
                    accessibilityRole="button"
                    accessibilityLabel={DASH.FOCUS_COMMITMENT_NO}
                  >
                    <Text style={styles.commitmentChipText}>{DASH.FOCUS_COMMITMENT_NO}</Text>
                  </Pressable>
                </View>
                <Pressable
                  onPress={() => handleCommitmentOmit(item.id)}
                  style={({ pressed }) => [styles.commitmentOmitLink, pressed && { opacity: 0.72 }]}
                  accessibilityRole="button"
                  accessibilityLabel={DASH.FOCUS_COMMITMENT_OMIT}
                >
                  <Text style={styles.commitmentOmitLinkText}>{DASH.FOCUS_COMMITMENT_OMIT}</Text>
                </Pressable>
              </View>
            ) : null}
            {showPartialPanel ? (
              <View style={styles.commitmentActions}>
                <Text style={styles.commitmentPrompt}>
                  {DASH.FOCUS_COMMITMENT_PARTIAL_HINT}
                </Text>
                <TextInput
                  style={styles.commitmentRenegotiateInput}
                  value={partialNoteId === item.id ? partialNote : String(item.partialNote || '')}
                  onChangeText={(v) => {
                    setPartialNoteId(item.id);
                    setPartialNote(v);
                  }}
                  placeholder={DASH.FOCUS_COMMITMENT_PARTIAL_NOTE_PLACEHOLDER}
                  accessibilityLabel={DASH.FOCUS_COMMITMENT_PARTIAL_NOTE_PLACEHOLDER}
                  maxLength={280}
                />
                <View style={styles.commitmentButtons}>
                  <Pressable
                    onPress={() => handlePartialNoteSave(item.id)}
                    style={({ pressed }) => [styles.commitmentChip, pressed && { opacity: 0.88 }]}
                    accessibilityRole="button"
                    accessibilityLabel={DASH.FOCUS_COMMITMENT_PARTIAL_NOTE_SAVE}
                  >
                    <Text style={styles.commitmentChipText}>
                      {DASH.FOCUS_COMMITMENT_PARTIAL_NOTE_SAVE}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handlePartialNoteSave(item.id, { dismissWithoutNote: true })}
                    style={({ pressed }) => [styles.commitmentChip, pressed && { opacity: 0.88 }]}
                    accessibilityRole="button"
                    accessibilityLabel={
                      DASH.FOCUS_COMMITMENT_PARTIAL_DONE || DASH.FOCUS_COMMITMENT_YES
                    }
                  >
                    <Text style={styles.commitmentChipText}>
                      {DASH.FOCUS_COMMITMENT_PARTIAL_DONE || 'Listo'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setPartialNoteId(null);
                      setPartialNote('');
                      setRenegotiateId(item.id);
                      setRenegotiateLabel(String(item.label || ''));
                    }}
                    style={({ pressed }) => [styles.commitmentChip, pressed && { opacity: 0.88 }]}
                    accessibilityRole="button"
                    accessibilityLabel={DASH.FOCUS_COMMITMENT_RENEGOTIATE}
                  >
                    <Text style={styles.commitmentChipText}>
                      {DASH.FOCUS_COMMITMENT_RENEGOTIATE}
                    </Text>
                  </Pressable>
                </View>
                <Pressable
                  onPress={() => handleCommitmentOmit(item.id)}
                  style={({ pressed }) => [styles.commitmentOmitLink, pressed && { opacity: 0.72 }]}
                  accessibilityRole="button"
                  accessibilityLabel={DASH.FOCUS_COMMITMENT_OMIT}
                >
                  <Text style={styles.commitmentOmitLinkText}>{DASH.FOCUS_COMMITMENT_OMIT}</Text>
                </Pressable>
              </View>
            ) : null}
            {showRenegotiate ? (
              <View style={styles.commitmentActions}>
                <Text style={styles.commitmentPrompt}>{DASH.FOCUS_COMMITMENT_RENEGOTIATE_HINT}</Text>
                <TextInput
                  style={styles.commitmentRenegotiateInput}
                  value={renegotiateId === item.id ? renegotiateLabel : String(item.label || '')}
                  onChangeText={(v) => {
                    setRenegotiateId(item.id);
                    setRenegotiateLabel(v);
                  }}
                  placeholder={DASH.FOCUS_COMMITMENT_RENEGOTIATE}
                  accessibilityLabel={DASH.FOCUS_COMMITMENT_RENEGOTIATE}
                />
                <View style={styles.commitmentButtons}>
                  <Pressable
                    onPress={() => handleCommitmentRenegotiate(item.id)}
                    style={({ pressed }) => [styles.commitmentChip, pressed && { opacity: 0.88 }]}
                    accessibilityRole="button"
                    accessibilityLabel={DASH.FOCUS_COMMITMENT_RENEGOTIATE_SAVE}
                  >
                    <Text style={styles.commitmentChipText}>
                      {DASH.FOCUS_COMMITMENT_RENEGOTIATE_SAVE}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleCommitmentOmit(item.id)}
                    style={({ pressed }) => [styles.commitmentChip, pressed && { opacity: 0.88 }]}
                    accessibilityRole="button"
                    accessibilityLabel={DASH.FOCUS_COMMITMENT_OMIT}
                  >
                    <Text style={styles.commitmentChipText}>{DASH.FOCUS_COMMITMENT_OMIT}</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
