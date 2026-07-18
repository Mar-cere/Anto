import Message from './Message.js';
import UserProfile from './UserProfile.js';
import TherapeuticRecord from './TherapeuticRecord.js';
import UserProgress from './UserProgress.js';
import UserInsight from './UserInsight.js';
import User from './User.js';
import Habit from './Habit.js';
import Task from './Task.js';
import UserGoals from './UserGoals.js';
import Conversation from './Conversation.js';
import CrisisEvent from './CrisisEvent.js';
import EmergencyAlert from './EmergencyAlert.js';
import TherapeuticTechniqueUsage from './TherapeuticTechniqueUsage.js';
import Transaction from './Transaction.js';
import Subscription from './Subscription.js';
import Journal from './Journal.js';
import AbcRecord from './AbcRecord.js';
import ExposurePlan from './ExposurePlan.js';
import BehavioralActivationLog from './BehavioralActivationLog.js';
import ClinicalScaleResult from './ClinicalScaleResult.js';
import CognitiveDistortionReport from './CognitiveDistortionReport.js';
import IntenseChatCheckIn from './IntenseChatCheckIn.js';
import GuestSession from './GuestSession.js';
import OpenAITokenUsageDay from './OpenAITokenUsageDay.js';
import SessionSummaryJob from './SessionSummaryJob.js';
import ExperientialPattern from './ExperientialPattern.js';
import ExperientialPatternJob from './ExperientialPatternJob.js';

// Validar que todos los modelos estén correctamente exportados
const models = {
  Message,
  UserProfile,
  TherapeuticRecord,
  UserProgress,
  UserInsight,
  User,
  Habit,
  Task,
  UserGoals,
  Conversation,
  CrisisEvent,
  EmergencyAlert,
  TherapeuticTechniqueUsage,
  Transaction,
  Subscription,
  Journal,
  AbcRecord,
  ExposurePlan,
  BehavioralActivationLog,
  ClinicalScaleResult,
  CognitiveDistortionReport,
  IntenseChatCheckIn,
  GuestSession,
  OpenAITokenUsageDay,
  SessionSummaryJob,
  ExperientialPattern,
  ExperientialPatternJob,
};

// Verificar que cada modelo sea válido
Object.entries(models).forEach(([name, model]) => {
  if (!model?.modelName) {
    console.warn(`Advertencia: El modelo ${name} podría no estar correctamente definido`);
  }
});

export {
  Message,
  UserProfile,
  TherapeuticRecord,
  UserProgress,
  UserInsight,
  User,
  Habit,
  Task,
  UserGoals,
  Conversation,
  CrisisEvent,
  EmergencyAlert,
  TherapeuticTechniqueUsage,
  Transaction,
  Subscription,
  Journal,
  AbcRecord,
  ExposurePlan,
  BehavioralActivationLog,
  ClinicalScaleResult,
  CognitiveDistortionReport,
  IntenseChatCheckIn,
  GuestSession,
  OpenAITokenUsageDay,
  SessionSummaryJob,
  ExperientialPattern,
  ExperientialPatternJob,
};

export default models; 