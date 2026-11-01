import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors as C, Glyph } from './challenge-ui';

type Props = { onStart: () => void; onSignIn: () => void; onExplore: () => void; shared: boolean };

function LinkButton({ label, onPress, primary = false, arrow = false }: { label: string; onPress: () => void; primary?: boolean; arrow?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ hovered, pressed }: any) => [s.button, primary && s.primary, (hovered || pressed) && { opacity: .8 }]}>
    <Text style={[s.buttonText, primary && { color: C.white }]}>{label}</Text>
    {arrow && <Glyph name="arrow-forward" size={18} color={primary ? C.white : C.green} />}
  </Pressable>;
}

export default function Home({ onStart, onSignIn, onExplore, shared }: Props) {
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const compact = width < 1050;
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [reducedMotion, setReducedMotion] = useState(true);
  const [howY, setHowY] = useState(0);
  const [walkDone, setWalkDone] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReducedMotion(value); });
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => { mounted = false; listener.remove(); };
  }, []);
  const motion = !mobile && !reducedMotion;
  const previewY = motion ? scrollY.interpolate({ inputRange: [0, 700], outputRange: [0, -28], extrapolate: 'clamp' }) : 0;
  const noteY = motion ? scrollY.interpolate({ inputRange: [0, 700], outputRange: [0, 18], extrapolate: 'clamp' }) : 0;
  const exploreLabel = shared ? 'Open your workspace' : 'Try the demo';

  return <Animated.ScrollView ref={scrollRef} testID="home-scroll" style={s.page} scrollEventThrottle={16}
    onScroll={motion ? Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: Platform.OS !== 'web' }) : undefined}
    contentContainerStyle={{ paddingHorizontal: mobile ? 22 : 48 }}>
    <View style={s.container}>
      <View style={[s.nav, mobile && { minHeight: 82 }]}>
        <View accessibilityLabel="Be Fit" style={s.brand}><Glyph name="leaf-outline" size={25} /><Text style={s.wordmark}>be fit.</Text></View>
        <View style={s.row}>
          {!mobile && <LinkButton label="How it works" onPress={() => scrollRef.current?.scrollTo({ y: howY, animated: !reducedMotion })} />}
          <LinkButton label={shared ? 'Your workspace' : 'Sign in'} onPress={shared ? onExplore : onSignIn} arrow />
        </View>
      </View>

      <View style={[s.hero, compact && s.heroStack, mobile && { paddingTop: 40, gap: 38, paddingBottom: 42 }]}>
        <View style={[s.heroCopy, compact ? { width: '100%', maxWidth: 660 } : { flex: 1 }]}>
          <Text role="heading" aria-level={1} style={[s.title, mobile && s.titleMobile]}>A little better.{ '\n' }<Text style={{ color: C.green }}>Together.</Text></Text>
          <Text style={[s.intro, mobile && { fontSize: 17, lineHeight: 28 }]}>Make a pact with your people. Set your goals, check in each day, and build habits you can keep.</Text>
          <View style={[s.actions, mobile && { gap: 6 }]}>
            <LinkButton label={shared ? 'Open your workspace' : 'Get started'} onPress={shared ? onExplore : onStart} primary arrow />
            {!shared && <LinkButton label="Try the demo" onPress={onExplore} />}
          </View>
          <Text style={s.caption}>Your goals. Your friends. A little accountability.</Text>
        </View>

        <View style={[s.previewStage, compact && { width: '100%', maxWidth: 600, alignSelf: 'center' }, mobile && { padding: 18, paddingBottom: 22 }]}>
          <Animated.View testID="home-preview" style={[s.preview, { transform: [{ translateY: previewY }] }]}>
            <View style={s.previewHeading}><View style={{ flex: 1, gap: 6 }}><Text style={s.previewTitle}>The daily pact</Text><Text style={s.caption}>A small promise to yourself.</Text></View><Glyph name="sunny-outline" size={25} /></View>
            <View style={s.week}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => <View key={i} style={[s.day, i === 4 && s.today]}><Text style={[s.dayText, i === 4 && { color: C.white }]}>{day}</Text>{i < 4 ? <Glyph name="checkmark" size={15} /> : <View style={[s.dayDot, i === 4 && { backgroundColor: C.white }]} />}</View>)}</View>
            <View style={[s.row, { justifyContent: 'space-between', marginBottom: 8 }]}><Text style={s.label}>Today’s goals</Text><Text accessibilityLiveRegion="polite" style={s.caption}>{walkDone ? '3' : '2'} of 3 done</Text></View>
            {[
              { title: 'Move your body', detail: 'Find your kind of movement.', icon: 'barbell-outline', done: true },
              { title: 'Eat a little better', detail: 'Small choices add up.', icon: 'nutrition-outline', done: true },
              { title: 'Take a 10-minute walk', detail: 'A little fresh air counts.', icon: 'walk-outline', done: walkDone },
            ].map((goal, i) => <View key={goal.title} style={s.goal}>
              {!mobile && <Glyph name={goal.icon} size={21} />}
              <View style={{ flex: 1, gap: 4 }}><Text style={s.goalTitle}>{goal.title}</Text><Text style={s.caption}>{goal.detail}</Text></View>
              {i === 2 ? <Pressable accessibilityRole="button" accessibilityLabel="Try checking in: Take a 10-minute walk" accessibilityState={{ selected: walkDone }} onPress={() => setWalkDone(value => !value)} style={({ hovered }: any) => [s.status, walkDone && s.done, hovered && { borderColor: C.green }]}>
                {walkDone && <Glyph name="checkmark" size={14} />}<Text style={s.statusText}>{walkDone ? 'Done' : 'Check in'}</Text>
              </Pressable> : <View style={[s.status, s.done]}><Glyph name="checkmark" size={14} /><Text style={s.statusText}>Done</Text></View>}
            </View>)}
            <Text style={[s.caption, { marginTop: 18 }]}>Interactive example · no check-ins are saved</Text>
          </Animated.View>
          <Animated.View testID="home-companion" style={[s.companion, { transform: [{ translateY: noteY }] }]}>
            <View style={s.friendMark}><Glyph name="people-outline" size={21} /></View>
            <View style={{ flex: 1, gap: 4 }}><Text style={s.label}>In it with you.</Text><Text style={s.caption}>A shared goal. Someone in your corner.</Text></View>
          </Animated.View>
        </View>
      </View>

      <View style={[s.promise, mobile && { gap: 18, alignItems: 'flex-start' }]}>
        {['Private challenges', 'Daily & weekly goals', 'Optional fines'].map(label => <View key={label} style={[s.row, { gap: 8 }]}><Glyph name="checkmark" size={16} /><Text style={s.promiseText}>{label}</Text></View>)}
      </View>

      <View onLayout={event => setHowY(event.nativeEvent.layout.y)} style={[s.how, compact && { flexDirection: 'column', gap: 32 }, mobile && { paddingVertical: 54 }]}>
        <View style={[s.howIntro, compact ? { width: '100%' } : { flex: 1 }]}>
          <Text role="heading" aria-level={2} style={[s.sectionTitle, mobile && { fontSize: 32, lineHeight: 38 }]}>Less organising.{ '\n' }More showing up.</Text>
          <Text style={s.body}>Keep the encouragement in your group chat. Give your goals a space of their own.</Text>
        </View>
        <View style={[s.steps, compact ? { width: '100%' } : { flex: 1 }]}>
          {[
            ['Make a pact', 'Create a private challenge, pick daily or weekly goals, and invite friends with a code. Agree on the rules together.'],
            ['Make it a daily thing', 'Mark each goal Done or Missed. Unmarked daily goals count as missed after midnight. Yesterday stays editable until the next midnight in your challenge’s timezone.'],
            ['See how you’re doing, together', 'Follow everyone’s progress and keep dues clear. Fines are optional; a weekly shortfall gets one flat fine.'],
          ].map(([title, copy], index) => <View key={title} style={[s.step, index === 0 && { paddingTop: 0 }]}><Text role="heading" aria-level={3} style={s.stepTitle}>{title}</Text><Text style={s.body}>{copy}</Text></View>)}
          <View style={[s.row, { alignItems: 'flex-start', gap: 10 }]}><Glyph name="information-circle-outline" size={19} /><Text style={[s.caption, { flex: 1 }]}>Payments are recorded manually and are self-reported, not verified. Be Fit does not transfer money.</Text></View>
        </View>
      </View>

      <View style={[s.closing, mobile && { flexDirection: 'column', alignItems: 'flex-start', gap: 24, padding: 26 }]}>
        <View style={[{ gap: 10 }, !mobile && { flex: 1 }]}><Text role="heading" aria-level={2} style={s.closingTitle}>Start small. Bring a friend.</Text><Text style={s.body}>Your next good habit can be a shared one.</Text></View>
        <LinkButton label={exploreLabel} onPress={onExplore} primary arrow />
      </View>
      <View style={s.footer}><Text style={s.footerBrand}>be fit.</Text><Text style={s.caption}>Good habits. Great company.</Text><Text style={s.caption}>Built for showing up, not showing off.</Text></View>
    </View>
  </Animated.ScrollView>;
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg }, container: { width: '100%', maxWidth: 1240, alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 }, nav: { minHeight: 108, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: C.line },
  brand: { flexDirection: 'row', gap: 10, alignItems: 'center' }, wordmark: { fontSize: 30, fontWeight: '700', letterSpacing: -1, color: C.ink },
  button: { minHeight: 48, paddingHorizontal: 18, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, borderRadius: 8 }, primary: { backgroundColor: C.green, paddingHorizontal: 24, minHeight: 52 }, buttonText: { fontSize: 14, fontWeight: '600', color: C.green },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 54, paddingTop: 76, paddingBottom: 72 }, heroStack: { flexDirection: 'column', alignItems: 'flex-start', gap: 48, paddingTop: 56 }, heroCopy: { minWidth: 0 },
  title: { fontSize: 72, lineHeight: 77, fontWeight: '600', letterSpacing: -2.6, color: C.ink }, titleMobile: { fontSize: 48, lineHeight: 53, letterSpacing: -1.7 }, intro: { fontSize: 18, lineHeight: 30, color: C.muted, maxWidth: 430, marginTop: 26 }, actions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 32, marginBottom: 18 },
  caption: { fontSize: 12, lineHeight: 19, color: C.muted }, label: { fontSize: 13, lineHeight: 20, color: C.ink, fontWeight: '600' },
  previewStage: { width: '47%', padding: 28, paddingBottom: 24, backgroundColor: C.inset, borderRadius: 12 }, preview: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 22 }, previewHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 }, previewTitle: { fontSize: 20, fontWeight: '600', color: C.ink, letterSpacing: -.5 },
  week: { flexDirection: 'row', gap: 6, marginVertical: 26 }, day: { flex: 1, height: 57, gap: 9, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }, today: { backgroundColor: C.green }, dayText: { fontSize: 11, color: C.muted }, dayDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.line, marginVertical: 6 },
  goal: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderColor: C.line }, goalTitle: { fontSize: 13, lineHeight: 19, fontWeight: '600', color: C.ink }, status: { minHeight: 44, minWidth: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 7, borderWidth: 1, borderColor: C.line, paddingHorizontal: 8 }, done: { backgroundColor: C.pale, borderColor: C.pale }, statusText: { fontSize: 11, fontWeight: '600', color: C.green },
  companion: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 22, paddingHorizontal: 6 }, friendMark: { backgroundColor: '#DFE8D7', width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  promise: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 24, gap: 24 }, promiseText: { fontSize: 13, lineHeight: 20, color: C.muted },
  how: { paddingVertical: 88, flexDirection: 'row', gap: 100 }, howIntro: { gap: 20 }, sectionTitle: { fontSize: 40, lineHeight: 47, letterSpacing: -1.2, color: C.ink, fontWeight: '600' }, body: { fontSize: 15, lineHeight: 25, color: C.muted, maxWidth: 510 }, steps: { gap: 24 }, step: { gap: 10, paddingTop: 24, paddingBottom: 24, borderBottomWidth: 1, borderColor: C.line }, stepTitle: { fontSize: 19, lineHeight: 26, fontWeight: '600', color: C.ink },
  closing: { backgroundColor: C.pale, borderRadius: 12, padding: 40, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 32 }, closingTitle: { fontSize: 28, lineHeight: 35, fontWeight: '600', letterSpacing: -.7, color: C.ink }, footer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 18, paddingVertical: 36 }, footerBrand: { fontSize: 20, fontWeight: '700', letterSpacing: -.5, color: C.green },
});
