/**
 * Paridad dashboard ↔ API daily-mood ↔ cliente.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function readSource(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

describe('Daily mood transport parity', () => {
  const serverSrc = readSource('server.js');
  const routesSrc = readSource('routes/dailyMoodRoutes.js');
  const focusSrc = readSource('services/dashboardFocusService.js');
  const promptSrc = readSource('services/openai/openaiPromptBuilder.js');
  const serviceSrc = readSource('../frontend/src/services/dailyMoodService.js');
  const cardSrc = readSource('../frontend/src/components/dashboard/MoodCheckInCard.js');
  const dashSrc = readSource('../frontend/src/screens/DashScreen.js');

  it('servidor monta /api/daily-mood con GET/PUT today', () => {
    expect(serverSrc).toMatch(/\/api\/daily-mood/);
    expect(routesSrc).toMatch(/router\.get\('\/today'/);
    expect(routesSrc).toMatch(/router\.put\('\/today'/);
    expect(routesSrc).toMatch(/invalidMood/);
  });

  it('foco y chat consumen daily mood', () => {
    expect(focusSrc).toMatch(/getTodayDailyMoodCheckIn/);
    expect(focusSrc).toMatch(/dailyMood/);
    expect(promptSrc).toMatch(/buildDailyMoodPromptSnippet/);
  });

  it('welcome del chat usa el puente de check-in y lo persiste en metadata', () => {
    const chatSrc = readSource('routes/chatRoutes.js');
    const copySrc = readSource('utils/dailyMoodCopy.js');
    expect(chatSrc).toMatch(/buildMoodBridgeWelcome/);
    // Ambos sitios de creación de welcome consultan el puente antes del saludo genérico.
    const bridgeUses = chatSrc.match(/buildMoodBridgeWelcome\(todayMood/g) || [];
    expect(bridgeUses.length).toBeGreaterThanOrEqual(2);
    expect(chatSrc).toMatch(/fromMoodCheckIn: true,\s*moodCheckInMood: todayMood\.mood/);
    expect(copySrc).toMatch(/getMoodBridgeGreetings/);
    const bridgeSrc = readSource('constants/moodBridgeGreetings.js');
    expect(bridgeSrc).toMatch(/moodBridgeGreetings\.data\.json/);
  });

  it('puente mood→chat no expone chatEmotion muerto', () => {
    const copySrc = readSource('utils/dailyMoodCopy.js');
    const cardSrc = readSource('../frontend/src/components/dashboard/MoodCheckInCard.js');
    expect(copySrc).not.toMatch(/chatEmotion/);
    expect(cardSrc).not.toMatch(/chatEmotion/);
  });

  it('cliente usa query plana y cache offline', () => {
    expect(serviceSrc).toMatch(/encodeURIComponent\(tz\)/);
    expect(serviceSrc).not.toMatch(/api\.get\([^,]+,\s*\{\s*params/);
    expect(serviceSrc).toMatch(/cacheTodayMoodPayload|loadCachedTodayMoodPayload/);
    expect(cardSrc).toMatch(/fetchTodayMoodCheckIn/);
    expect(cardSrc).toMatch(/saveTodayMoodCheckIn/);
    expect(dashSrc).toMatch(/MoodCheckInCard/);
    expect(dashSrc).toMatch(/handleMoodSaved|onMoodSaved/);
  });
});
