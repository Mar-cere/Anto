/**
 * Sección de tareas de la sesión Pomodoro (lista, input, limpiar completadas).
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CHECKBOX_ICON_SIZE,
  CHECKBOX_MARGIN_RIGHT,
  CLEAR_BUTTON_BORDER_RADIUS,
  CLEAR_BUTTON_MARGIN_TOP,
  CLEAR_BUTTON_PADDING,
  COLORS,
  CONTROLS_GAP,
  DELETE_BUTTON_MARGIN_LEFT,
  DELETE_ICON_SIZE,
  EMPTY_ICON_SIZE,
  INPUT_BORDER_RADIUS,
  INPUT_CONTAINER_MARGIN_BOTTOM,
  INPUT_FONT_SIZE,
  INPUT_HEIGHT,
  INPUT_PADDING_HORIZONTAL,
  TASK_HEADER_MARGIN_BOTTOM,
  TASK_ITEM_BORDER_RADIUS,
  TASK_ITEM_PADDING,
  TASK_LIST_GAP,
  TASKS_SECTION_BORDER_RADIUS,
  TASKS_SECTION_PADDING,
  TITLE_FONT_SIZE,
  TITLE_MARGIN_BOTTOM,
  TEXTS,
} from '../../screens/pomodoro/pomodoroScreenConstants';
import { FOCUS_BORDER_SUBTLE, FOCUS_META } from '../../styles/focusCardTheme';

const BUTTON_SIZE = 48;

export default function PomodoroTasksSection({
  tasks,
  inputText,
  setInputText,
  handleAddTask,
  toggleTask,
  deleteTask,
  clearCompletedTasks,
  completedTasksCount,
  density = 'comfortable',
}) {
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  return (
    <View style={[styles.tasksSection, density === 'compact' && styles.tasksSectionCompact]}>
      <View style={styles.taskHeader}>
        <Text style={styles.title}>{TEXTS.TASKS_TITLE}</Text>
        <Text style={styles.taskCount}>
          {completedTasksCount}/{tasks.length}
        </Text>
      </View>
      <View style={[styles.inputContainer, density === 'compact' && styles.inputContainerCompact]}>
        <TextInput
          style={[styles.input, density === 'compact' && styles.inputCompact]}
          value={inputText}
          onChangeText={setInputText}
          placeholder={TEXTS.NEW_TASK_PLACEHOLDER}
          placeholderTextColor={COLORS.ACCENT}
          autoCapitalize="sentences"
          onSubmitEditing={handleAddTask}
        />
        <TouchableOpacity style={[styles.addButton, density === 'compact' && styles.addButtonCompact]} onPress={handleAddTask}>
          <MaterialCommunityIcons name="plus" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>
      <View style={styles.taskList}>
        {sortedTasks.map((task) => (
          <View key={task.id} style={[styles.taskItem, density === 'compact' && styles.taskItemCompact]}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => toggleTask(task.id)}
            >
              <MaterialCommunityIcons
                name={
                  task.completed
                    ? 'checkbox-marked-circle'
                    : 'checkbox-blank-circle-outline'
                }
                size={CHECKBOX_ICON_SIZE}
                color={task.completed ? COLORS.SUCCESS : COLORS.ACCENT}
              />
            </TouchableOpacity>
            <Text
              style={[styles.taskText, task.completed && styles.completedText]}
            >
              {task.text}
            </Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteTask(task.id)}
            >
              <MaterialCommunityIcons
                name="close-circle"
                size={DELETE_ICON_SIZE}
                color={COLORS.ERROR}
              />
            </TouchableOpacity>
          </View>
        ))}
      </View>
      {tasks.some((t) => t.completed) && (
        <TouchableOpacity style={styles.clearButton} onPress={clearCompletedTasks}>
          <Text style={styles.clearButtonText}>{TEXTS.CLEAR_COMPLETED}</Text>
        </TouchableOpacity>
      )}
      {tasks.length === 0 && (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="clipboard-text-outline"
            size={EMPTY_ICON_SIZE}
            color={COLORS.ACCENT}
          />
          <Text style={styles.emptyStateText}>{TEXTS.EMPTY_TASKS}</Text>
          <View style={styles.ideasWrap}>
            <Text style={styles.ideasTitle}>{TEXTS.EMPTY_TASKS_HELP_TITLE}</Text>
            <Text style={styles.ideaItem}>• {TEXTS.EMPTY_TASKS_IDEA_1}</Text>
            <Text style={styles.ideaItem}>• {TEXTS.EMPTY_TASKS_IDEA_2}</Text>
            <Text style={styles.ideaItem}>• {TEXTS.EMPTY_TASKS_IDEA_3}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tasksSection: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: TASKS_SECTION_BORDER_RADIUS,
    padding: TASKS_SECTION_PADDING,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
  },
  tasksSectionCompact: {
    padding: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: TASK_HEADER_MARGIN_BOTTOM,
  },
  title: {
    fontSize: TITLE_FONT_SIZE,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: 'rgba(255,255,255,0.94)',
    marginBottom: TITLE_MARGIN_BOTTOM,
  },
  taskCount: {
    color: FOCUS_META,
    fontSize: 13,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: INPUT_CONTAINER_MARGIN_BOTTOM,
    gap: CONTROLS_GAP,
  },
  inputContainerCompact: {
    marginBottom: 12,
  },
  input: {
    flex: 1,
    height: INPUT_HEIGHT,
    backgroundColor: COLORS.INPUT_BACKGROUND,
    borderRadius: INPUT_BORDER_RADIUS,
    paddingHorizontal: INPUT_PADDING_HORIZONTAL,
    color: COLORS.WHITE,
    fontSize: INPUT_FONT_SIZE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
  },
  inputCompact: {
    height: 42,
    fontSize: 14,
  },
  addButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: INPUT_BORDER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonCompact: {
    width: 42,
    height: 42,
  },
  taskList: {
    gap: TASK_LIST_GAP,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.INPUT_BACKGROUND,
    borderRadius: TASK_ITEM_BORDER_RADIUS,
    padding: TASK_ITEM_PADDING,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
  },
  taskItemCompact: {
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  checkbox: {
    marginRight: CHECKBOX_MARGIN_RIGHT,
  },
  taskText: {
    flex: 1,
    color: COLORS.WHITE,
    fontSize: INPUT_FONT_SIZE,
  },
  completedText: {
    color: COLORS.ACCENT,
    textDecorationLine: 'line-through',
  },
  deleteButton: {
    marginLeft: DELETE_BUTTON_MARGIN_LEFT,
  },
  clearButton: {
    backgroundColor: COLORS.CLEAR_BUTTON_BACKGROUND,
    padding: CLEAR_BUTTON_PADDING,
    borderRadius: CLEAR_BUTTON_BORDER_RADIUS,
    alignSelf: 'flex-end',
    marginTop: CLEAR_BUTTON_MARGIN_TOP,
  },
  clearButtonText: {
    color: COLORS.ERROR,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  emptyStateText: {
    color: FOCUS_META,
    fontSize: 14,
    marginTop: 4,
  },
  ideasWrap: {
    marginTop: 10,
    alignSelf: 'stretch',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
  },
  ideasTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  ideaItem: {
    color: FOCUS_META,
    fontSize: 12,
    marginBottom: 2,
  },
});
