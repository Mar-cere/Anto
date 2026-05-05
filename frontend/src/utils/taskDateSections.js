/**
 * Agrupa tareas / recordatorios por fecha de vencimiento (zonas relativas a "hoy").
 * @param {Array<object>} items
 * @returns {Array<{ key: string, title: string, data: object[] }>}
 */
function stripTime(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function mondayOfWeekMs(d) {
  const x = new Date(d);
  const day = x.getDay();
  const diffToMon = (day + 6) % 7;
  x.setDate(x.getDate() - diffToMon);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

export function bucketTaskItem(item, now = new Date()) {
  if (item.completed) return 'completed';
  if (item.dueDate == null) return 'later';
  const due = new Date(item.dueDate);
  if (Number.isNaN(due.getTime())) return 'later';
  if (due < now) return 'overdue';
  const sodToday = stripTime(now);
  const sodDue = stripTime(due);
  const diffDays = Math.round((sodDue - sodToday) / 86400000);
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (mondayOfWeekMs(due) === mondayOfWeekMs(now) && diffDays >= 2) return 'this_week';
  return 'later';
}

const SECTION_META = [
  { key: 'overdue', title: 'Vencidas' },
  { key: 'today', title: 'Hoy' },
  { key: 'tomorrow', title: 'Mañana' },
  { key: 'this_week', title: 'Esta semana' },
  { key: 'later', title: 'Más adelante' },
  { key: 'completed', title: 'Completadas' },
];

export function buildTaskSections(items) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const buckets = {};
  SECTION_META.forEach(({ key }) => {
    buckets[key] = [];
  });
  items.forEach((item) => {
    const b = bucketTaskItem(item);
    if (buckets[b]) buckets[b].push(item);
  });
  SECTION_META.forEach(({ key }) => {
    buckets[key].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  });
  return SECTION_META.filter(({ key }) => buckets[key].length > 0).map(({ key, title }) => ({
    key,
    title,
    data: buckets[key],
  }));
}
