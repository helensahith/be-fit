import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

export type CelebrationEvent = { id: number; kind: 'goal' | 'checkin'; message: string };
function useReducedMotion() {
  const [reduced, setReduced] = useState(() => Platform.OS === 'web' && typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : true);
  useEffect(() => {
    if (Platform.OS === 'web') { const query = window.matchMedia('(prefers-reduced-motion: reduce)'); const update = () => setReduced(query.matches); update(); query.addEventListener('change', update); return () => query.removeEventListener('change', update); }
    let active = true; AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduced(value); });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { active = false; sub.remove(); };
  }, []);
  return reduced;
}

export default function Celebration({ event }: { event: CelebrationEvent | null }) {
  const { width, height } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced); reducedRef.current = reduced;
  useEffect(() => { if (reduced) progress.stopAnimation(); }, [reduced, progress]);
  useEffect(() => {
    if (!event) return;
    progress.stopAnimation(); progress.setValue(0); setVisible(true);
    const animation = reducedRef.current ? null : Animated.timing(progress, { toValue: 1, duration: 1250, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' });
    animation?.start();
    const timer = setTimeout(() => setVisible(false), 1900);
    return () => { clearTimeout(timer); animation?.stop(); };
  }, [event?.id, progress]);
  if (!visible || !event) return null;
  const count = event.kind === 'checkin' ? 48 : 30;
  const palette = ['#276248', '#84A976', '#D9B867', '#A14F30', '#D7E8CB'];
  return <View pointerEvents="none" testID="celebration-feedback" style={[StyleSheet.absoluteFill, { zIndex: 1000, overflow: 'hidden' }]}>
    {!reduced && <View testID="confetti-particles" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
      {Array.from({ length: count }, (_, i) => {
        const side = i % 2 ? -1 : 1;
        const spread = 70 + (i * 47 % Math.max(120, Math.round(width * .65)));
        const lift = 110 + i * 29 % 190;
        return <Animated.View key={`${event.id}:${i}`} style={{ position: 'absolute', left: side === 1 ? width * .12 : width * .88, top: height * .5, width: 5 + i % 4, height: 7 + i % 6, borderRadius: i % 3 === 0 ? 4 : 1, backgroundColor: palette[i % palette.length], opacity: progress.interpolate({ inputRange: [0, .04, .75, 1], outputRange: [0, 1, 1, 0] }), transform: [
          { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, side * spread] }) },
          { translateY: progress.interpolate({ inputRange: [0, .32, .58, 1], outputRange: [0, -lift, -lift * .65, height * .55] }) },
          { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: [`${i * 23}deg`, `${i * 23 + side * (350 + i * 11)}deg`] }) },
        ] }} />;
      })}
    </View>}
    <View accessibilityLiveRegion="polite" style={{ position: 'absolute', top: 88, alignSelf: 'center', maxWidth: Math.min(width - 32, 460), backgroundColor: '#276248', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 9 }}>
      <Text style={{ fontSize: 21 }} accessibilityElementsHidden importantForAccessibility="no">🎉</Text><Text style={{ color: '#FFFFFF', fontSize: 13, lineHeight: 20, fontWeight: '600', flexShrink: 1 }}>{event.message}</Text>
    </View>
  </View>;
}
