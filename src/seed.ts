import { addDays, Challenge, Goal, todayIn } from './domain';
export const starterGoals: Goal[] = [
  { id: 'gym', title: 'Show up at the gym', description: '5 sessions a week. Rest days are part of the plan.', frequency: 'weekly', target: 5, penalty: 50, icon: 'barbell-outline' },
  { id: 'protein', title: 'Hit your protein goal', description: 'Your personal protein target. Progress without pressure.', frequency: 'daily', target: 1, penalty: 0, icon: 'nutrition-outline' },
  { id: 'food', title: 'Skip outside food', description: 'California Burrito & office meals are on the safe list.', frequency: 'daily', target: 1, penalty: 100, icon: 'restaurant-outline' },
  { id: 'sugar', title: 'Say no to added sugar', description: 'A little less sweet. A little more discipline.', frequency: 'daily', target: 1, penalty: 100, icon: 'cube-outline' },
  { id: 'cardio', title: 'Get 10 minutes of cardio', description: 'Walk, run, cycle. Just get your heart moving.', frequency: 'daily', target: 1, penalty: 50, icon: 'walk-outline' },
];
export function seed(): Challenge[] {
  const today = todayIn(); const start = addDays(today, -6);
  const c: Challenge = { id: 'demo-battle', name: 'Battle of fits', description: 'A little competition. A better version of us.', start, end: addDays(today, 23), timezone: 'Asia/Kolkata', invite: 'DEMO26', ownerId: 'demo-you', goals: starterGoals.map(g => ({ ...g })), members: [{ id: 'demo-you', name: 'Helen', joined: start }, { id: 'demo-friend', name: 'Charith', joined: start }], checkins: [], payments: [] };
  for (let day = 0; day < 6; day++) for (const member of c.members) for (const goal of c.goals) c.checkins.push({ userId: member.id, goalId: goal.id, date: addDays(start, day), done: !(member.id === 'demo-friend' ? day === 1 && goal.id === 'food' || day === 3 && goal.id === 'sugar' : day === 2 && goal.id === 'cardio') });
  c.payments.push({ id: 'demo-payment', userId: 'demo-friend', amount: 100, date: addDays(today, -1), note: 'Example manual settlement' });
  return [c];
}
