/**
 * Micro-guide modules (English).
 */
function step(title, body) {
  return { title: String(title || '').trim(), body: String(body || '').trim() };
}

export const MICRO_GUIDE_MODULES_EN = {
  grief_roadmap: {
    title: 'Grief roadmap',
    intro: 'A brief guide to support you in loss, without rushing the process.',
    estimatedMinutes: 3,
    steps: [
      step('Name what you feel', 'Label one emotion present (sadness, emptiness, anger). It does not need to be perfect.'),
      step('A symbolic gesture', 'Write one sentence you would say to who or what you miss.'),
      step('Minimum care today', 'Pick one small action: water, rest, a message to someone safe.'),
    ],
    completionNote: 'Grief is not linear. Returning to this guide when needed is okay.',
  },
  relapse_prevention: {
    title: 'Relapse prevention',
    intro: 'A brief plan when you notice old patterns returning.',
    estimatedMinutes: 3,
    steps: [
      step('Early signal', 'What thought, body sensation, or situation showed up first?'),
      step('5-minute plan B', 'Define one very small alternative action you can do now.'),
      step('Support', 'Who could you tell, or which app resource would you use today?'),
    ],
    completionNote: 'A slip does not erase prior progress. Adjusting the plan is part of care.',
  },
  dbt_stop_skill: {
    title: 'STOP skill',
    intro: 'Four steps to pause before acting on autopilot.',
    estimatedMinutes: 2,
    steps: [
      step('S — Stop', 'Freeze what you are doing. Feet on the floor, hands still for a moment.'),
      step('T — Breathe', 'Three slow breaths. Count to four in and out.'),
      step('O — Observe', 'Notice body and mind without judging.'),
      step('P — Proceed', 'Choose the next step aligned with your values, however small.'),
    ],
    completionNote: 'STOP does not remove emotion; it creates space to choose.',
  },
  act_values_check: {
    title: 'Values check-in',
    intro: 'Connect what you do today with what truly matters.',
    estimatedMinutes: 3,
    steps: [
      step('Three values', 'Write three words for how you want to live (e.g. honesty, calm, connection).'),
      step('Aligned action', 'What 10-minute action would honor one value today?'),
      step('Obstacle', 'What pulls you away from that value? Name it without blame.'),
    ],
    completionNote: 'Values guide; they do not demand perfection.',
  },
  sleep_diary_lite: {
    title: 'Brief sleep diary',
    intro: 'Minimal tracking to see patterns without obsessing over numbers.',
    estimatedMinutes: 2,
    steps: [
      step('Last night', 'What time did you go to bed and roughly how long to fall asleep?'),
      step('Today', 'Wake time and energy level (1–10)?'),
      step('One habit', 'Pick one change for tonight: less screen, steady schedule, or dark room.'),
    ],
    completionNote: 'Regularity often helps more than a perfect diary.',
  },
  mindfulness_sequence: {
    title: 'Mindfulness sequence',
    intro: 'Brief present-moment anchor (MBSR-lite).',
    estimatedMinutes: 3,
    steps: [
      step('Posture', 'Sit comfortably. Soft shoulders, relaxed jaw.'),
      step('Breath', 'Follow air in and out for one minute.'),
      step('Sounds and body', 'Notice three sounds and one body sensation without changing it.'),
    ],
    completionNote: 'The mind will wander; returning to breath is the practice.',
  },
  assertive_i_messages: {
    title: 'I-messages',
    intro: 'State a boundary or request with clarity and respect.',
    estimatedMinutes: 3,
    steps: [
      step('When…', 'Describe the concrete fact, without insults or global labels.'),
      step('I feel…', 'Name your emotion and its intensity.'),
      step('I need…', 'Ask for a specific change or possible agreement.'),
    ],
    completionNote: 'Practice out loud before sending if it helps.',
  },
  problem_solving_psst: {
    title: 'Problem solving (PSST)',
    intro: 'Structure a problem into manageable steps.',
    estimatedMinutes: 4,
    steps: [
      step('Define', 'Write the problem in one observable sentence.'),
      step('Options', 'List at least three alternatives, even imperfect ones.'),
      step('Choose and try', 'Pick the most viable option and a first step under 15 minutes.'),
    ],
    completionNote: 'You can review the plan tomorrow with new data.',
  },
  performance_anxiety_tool: {
    title: 'Performance anxiety',
    intro: 'Brief prep before performing or being evaluated.',
    estimatedMinutes: 2,
    steps: [
      step('Realistic goal', 'What is the minimum acceptable outcome, not the perfect one?'),
      step('Body', 'Tense and release shoulders and jaw three times.'),
      step('Support phrase', 'Write what you would tell a friend in your place.'),
    ],
    completionNote: 'Anxiety is energy; you can channel it into preparation.',
  },
  present_moment_exercise: {
    title: 'Return to the present',
    intro: 'Quick grounding when the mind races ahead.',
    estimatedMinutes: 2,
    steps: [
      step('5-4-3-2-1', 'Name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste.'),
      step('Feet', 'Notice contact of your feet with the ground.'),
    ],
    completionNote: 'Repeat if the mind speeds up again.',
  },
  social_anxiety_tool: {
    title: 'Social anxiety',
    intro: 'Prep for interactions that raise tension.',
    estimatedMinutes: 3,
    steps: [
      step('Prediction', 'What do you think will happen? Write it as a hypothesis.'),
      step('Alternative', 'What other explanation is possible?'),
      step('Micro-step', 'Define the smallest social gesture (greet, one question).'),
    ],
    completionNote: 'Gradual exposure reduces fear over time.',
  },
  exposure_guide: {
    title: 'Gradual exposure',
    intro: 'Remember principles of safe exposure.',
    estimatedMinutes: 2,
    steps: [
      step('Hierarchy', 'Start with the lowest step on your list, not the hardest.'),
      step('Stay', 'Remain until anxiety drops somewhat without fleeing.'),
      step('Log', 'Note SUDS before and after to see progress.'),
    ],
    completionNote: 'Use the app exposure hierarchy for structured steps.',
  },
  reframing_tool: {
    title: 'Reframing',
    intro: 'Shift the angle on a rigid thought.',
    estimatedMinutes: 3,
    steps: [
      step('Thought', 'Write the automatic phrase as it appears.'),
      step('Evidence for and against', 'List facts, not assumptions.'),
      step('Balanced alternative', 'Draft a more flexible, realistic version.'),
    ],
    completionNote: 'The AT log in the app can deepen this exercise.',
  },
  task_organization: {
    title: 'Organize tasks',
    intro: 'Unblock overload with one clear first step.',
    estimatedMinutes: 2,
    steps: [
      step('Brain dump', 'List everything pending without ordering.'),
      step('One priority', 'Mark highest impact or heaviest task.'),
      step('5-minute first step', 'Define the smallest action to start.'),
    ],
    completionNote: 'You can create a task in the app from chat if it fits.',
  },
  time_management: {
    title: 'Time management',
    intro: 'Recover focus when the day scatters.',
    estimatedMinutes: 2,
    steps: [
      step('Single block', 'Choose 25 minutes for one thing only.'),
      step('Interruptions', 'Note what interrupts you and one simple rule.'),
      step('Break', 'Schedule 5 screen-free minutes after the block.'),
    ],
    completionNote: 'Less multitasking often means more real progress.',
  },
  anger_management: {
    title: 'Manage anger',
    intro: 'Lower intensity before responding.',
    estimatedMinutes: 3,
    steps: [
      step('Pause', 'Count to 10 before typing or speaking.'),
      step('Body', 'Notice tension in jaw, fists, or chest.'),
      step('Need', 'What boundary or need is behind the anger?'),
    ],
    completionNote: 'Anger often signals something important; naming it helps.',
  },
  physical_activity: {
    title: 'Gentle movement',
    intro: 'Minimal body activation when mood is low.',
    estimatedMinutes: 2,
    steps: [
      step('Choose', 'Walk 5 min, stretch, or take stairs once.'),
      step('Now or schedule', 'If not now, set a concrete time today.'),
      step('After', 'Note how the body feels (without expecting euphoria).'),
    ],
    completionNote: 'Gentle movement supports mood; it does not replace rest.',
  },
  forgiveness_work: {
    title: 'Forgiveness (brief)',
    intro: 'Personal work on guilt or resentment; not excusing harm.',
    estimatedMinutes: 3,
    steps: [
      step('What happened', 'Describe facts in a few lines.'),
      step('Load', 'What are you carrying (guilt, anger, shame)?'),
      step('Partial release', 'What could you let go today, even 1%?'),
    ],
    completionNote: 'Deep forgiveness may need professional support.',
  },
  values_exploration: {
    title: 'Explore values',
    intro: 'Clarify the direction of your decisions.',
    estimatedMinutes: 3,
    steps: [
      step('Alive moments', 'When did you feel most like yourself recently?'),
      step('Value behind', 'What value was in that experience?'),
      step('Small action', 'One step today aligned with that value.'),
    ],
    completionNote: 'Values evolve; review them gently.',
  },
  apology_guide: {
    title: 'Apologize',
    intro: 'Repair a bond with genuine responsibility.',
    estimatedMinutes: 3,
    steps: [
      step('Specific act', 'What you did or said, without “if you were offended”.'),
      step('Impact', 'How it may have affected the other person.'),
      step('Commitment', 'What you will do differently from now on.'),
    ],
    completionNote: 'A sincere apology does not require immediate forgiveness.',
  },
};
