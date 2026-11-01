import { Challenge, checkinFor, goalsOn, weeklyProgress } from './domain';

export type DayMood = { emoji: string; label: string; detail: string; tone: 'positive' | 'gentle' | 'neutral' };
export function dayMood(c: Challenge, userId: string, date: string, today: string, draft?: Record<string, boolean>): DayMood {
  const member = c.members.find(m => m.id === userId);
  const goals = goalsOn(c, date);
  if (!member || date < member.joined || !goals.length) return { emoji: '🌱', label: 'A fresh start', detail: 'Your next chance to show up is on its way.', tone: 'neutral' };
  const status = (id: string) => draft && Object.prototype.hasOwnProperty.call(draft, id) ? draft[id] : checkinFor(c, id, userId, date)?.done;
  const daily = goals.filter(g => g.frequency === 'daily');
  const done = daily.filter(g => status(g.id) === true).length;
  const missed = daily.filter(g => status(g.id) === false || date < today && status(g.id) === undefined).length;
  if (daily.length && done === daily.length) return { emoji: '🎉', label: 'Daily goals complete', detail: 'You showed up for every daily goal.', tone: 'positive' };
  if (missed > 0 && missed >= done) return { emoji: '😔', label: 'A tough day. Keep going.', detail: 'One missed goal doesn’t erase your progress.', tone: 'gentle' };
  if (done > 0 || goals.some(g => g.frequency === 'weekly' && status(g.id) === true)) return { emoji: '😊', label: 'Making progress', detail: 'Every small win counts.', tone: 'positive' };
  if (!daily.length && goals.every(g => {
    const progress = weeklyProgress(c, g, userId, date);
    const adjusted = draft && Object.prototype.hasOwnProperty.call(draft, g.id) ? progress.done - (checkinFor(c, g.id, userId, date)?.done ? 1 : 0) + (draft[g.id] ? 1 : 0) : progress.done;
    return adjusted >= progress.target;
  })) return { emoji: '😌', label: 'Rest day earned', detail: 'Your weekly targets are already met.', tone: 'positive' };
  return { emoji: '🌱', label: 'A fresh start', detail: date < today ? 'A new day is another chance.' : 'No rush. Start with one small win.', tone: 'neutral' };
}
