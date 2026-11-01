import React from 'react';
import { View, Text } from 'react-native';
import { Challenge } from './domain';
import { dayMood } from './day-mood';
import { colors as C } from './challenge-ui';

export default function DayMood({ challenge, userId, date, today, draft, compact = false }: { challenge: Challenge; userId: string; date: string; today: string; draft?: Record<string, boolean>; compact?: boolean }) {
  const mood = dayMood(challenge, userId, date, today, draft);
  return <View testID={`day-mood-${date}-${userId}`} accessible accessibilityLabel={`Your day: ${mood.label}. ${mood.detail}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: compact ? 8 : 12, paddingVertical: compact ? 3 : 8 }}>
    <Text style={{ fontSize: compact ? 18 : 22 }} accessibilityElementsHidden importantForAccessibility="no">{mood.emoji}</Text>
    <View style={{ flex: 1 }}><Text style={{ color: mood.tone === 'gentle' ? C.orange : mood.tone === 'positive' ? C.green : C.muted, fontSize: 12, lineHeight: 19, fontWeight: '600' }}>{mood.label}</Text>{!compact && <Text style={{ color: C.muted, fontSize: 12, lineHeight: 19 }}>{mood.detail}</Text>}</View>
  </View>;
}
