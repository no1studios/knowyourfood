import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { useGuestSession } from '@/components/GuestSession';
import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import { Button, Icon, Modal, Tag } from '@/components/ui';
import type { PastelTone } from '@/components/ui';
import { copy } from '@/lib/i18n/copy';

type Variant = 'keep-all' | 'collision' | 'skip' | 'signed-in';

/** Guest C1–C4 — Merge modal + post-merge confirmation. */
export default function MergeScreen() {
  const { variant: raw = 'keep-all' } = useLocalSearchParams<{ variant?: string }>();
  const variant = (raw as Variant) || 'keep-all';
  const { locale } = useLocale();
  const { colors, type, radius, space } = useTheme();
  const { setHasRecipes, setSignedIn, showToast } = useGuestSession();
  const c = copy(locale);

  const finish = (toast: string) => {
    setHasRecipes(true);
    setSignedIn(true);
    showToast(toast);
    router.replace('/(tabs)');
  };

  useEffect(() => {
    if (variant === 'signed-in') {
      finish(c.merge.keep.toast);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]);

  if (variant === 'signed-in') {
    return <View style={{ flex: 1, backgroundColor: colors.scrim }} />;
  }

  if (variant === 'skip') {
    return (
      <Modal
        inline
        icon="check"
        tone="mint"
        title={c.merge.skip.title}
        body={c.merge.skip.body}
        onScrimPress={() => finish(c.merge.skip.toast)}
        actions={
          <Button variant="primary" size="lg" block onPress={() => finish(c.merge.skip.toast)}>
            {c.merge.skip.primary}
          </Button>
        }
      />
    );
  }

  if (variant === 'collision') {
    const m = c.merge.collision;
    return (
      <Modal
        inline
        icon="sparkle"
        tone="haldi"
        title={m.title}
        body={m.body}
        onScrimPress={() => finish(m.toast)}
        actions={
          <>
            <Button variant="primary" size="lg" block onPress={() => finish(m.toast)}>
              {m.primary}
            </Button>
            <Button variant="ghost" block onPress={() => finish(m.toast)}>
              {m.secondary}
            </Button>
          </>
        }
      >
        <CompareTiles
          left={{ title: m.phoneTitle, sub: m.phoneSub, tone: 'haldi', icon: 'phone' }}
          right={{ title: m.acctTitle, sub: m.acctSub, tone: 'peach', icon: 'user' }}
        />
        <Text style={[type.overline, { color: colors.inkMuted, marginTop: space[3] }]}>
          {m.afterLbl}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, width: '100%' }}>
          <AfterChip title={m.afterTitle} tag={m.afterAccount} tone="mint" />
          <AfterChip title={m.afterCopy} tag={m.afterPhone} tone="haldi" />
        </View>
      </Modal>
    );
  }

  const m = c.merge.keep;
  return (
    <Modal
      inline
      icon="sparkle"
      tone="sky"
      title={m.title}
      body={m.body}
      onScrimPress={() => finish(m.toast)}
      actions={
        <>
          <Button variant="primary" size="lg" block onPress={() => finish(m.toast)}>
            {m.primary}
          </Button>
          <Button variant="ghost" block onPress={() => router.replace('/(tabs)')}>
            {m.secondary}
          </Button>
        </>
      }
    >
      <CompareTiles
        left={{ title: m.phoneTitle, sub: m.phoneSub, tone: 'haldi', icon: 'phone' }}
        right={{ title: m.acctTitle, sub: m.acctSub, tone: 'mint', icon: 'user' }}
      />
      <Text style={[type.caption, { color: colors.inkMuted, marginTop: space[3] }]}>{m.total}</Text>
    </Modal>
  );
}

function CompareTiles({
  left,
  right,
}: {
  left: { title: string; sub: string; tone: PastelTone; icon: 'phone' | 'user' };
  right: { title: string; sub: string; tone: PastelTone; icon: 'phone' | 'user' };
}) {
  const { colors, type, radius, space } = useTheme();
  const toneBg = (t: PastelTone) =>
    ({
      mint: colors.pastelMint,
      haldi: colors.pastelHaldi,
      sky: colors.pastelSky,
      rose: colors.pastelRose,
      pista: colors.pastelPista,
      peach: colors.pastelPeach,
    })[t];
  const toneFg = (t: PastelTone) =>
    ({
      mint: colors.onPastelMint,
      haldi: colors.onPastelHaldi,
      sky: colors.onPastelSky,
      rose: colors.onPastelRose,
      pista: colors.onPastelPista,
      peach: colors.onPastelPeach,
    })[t];

  return (
    <View style={{ flexDirection: 'row', gap: 8, width: '100%', marginTop: space[3] }}>
      {[left, right].map((tile) => (
        <View
          key={tile.title + tile.sub}
          style={{
            flex: 1,
            gap: 6,
            padding: space[3],
            borderRadius: radius.lg,
            backgroundColor: colors.surfaceSunken,
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: radius.full,
              backgroundColor: toneBg(tile.tone),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={tile.icon} size={16} color={toneFg(tile.tone)} />
          </View>
          <Text style={[type.label, { color: colors.ink }]}>{tile.title}</Text>
          <Text style={[type.caption, { color: colors.inkMuted }]}>{tile.sub}</Text>
        </View>
      ))}
    </View>
  );
}

function AfterChip({ title, tag, tone }: { title: string; tag: string; tone: PastelTone }) {
  const { colors, type, radius, space } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        gap: 6,
        padding: space[3],
        borderRadius: radius.lg,
        backgroundColor: colors.surfaceSunken,
      }}
    >
          <Tag tone={tone}>{tag}</Tag>
      <Text style={[type.label, { color: colors.ink }]}>{title}</Text>
    </View>
  );
}
