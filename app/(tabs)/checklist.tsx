import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import { AppHeader, Chip, Fab, IconButton, ListRow } from '@/components/ui';
import { copy } from '@/lib/i18n/copy';

/** Artboard 08 — Shopping checklist with Checkbox/ListRow aisle groups. */
export default function ChecklistScreen() {
  const { locale } = useLocale();
  const { colors, type, space, radius, elevation } = useTheme();
  const insets = useSafeAreaInsets();
  const c = copy(locale);
  const allIds = useMemo(() => c.list.groups.flatMap((g) => g.rows.map((r) => r.id)), [c.list.groups]);
  const [done, setDone] = useState<Record<string, boolean>>({ ginger: true, atta: true });
  const doneN = allIds.filter((id) => done[id]).length;
  const pct = allIds.length ? Math.round((doneN / allIds.length) * 100) : 0;
  const bottomPad = 12 + 72 + 24 + insets.bottom;

  const toggle = (id: string) => setDone((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }}>
        <AppHeader
          variant="large"
          eyebrow={c.list.eyebrow}
          title={c.list.title}
          actions={
            <IconButton icon="share" label={c.list.share} variant="surface" />
          }
        />

        <View style={{ paddingHorizontal: space[5], gap: space[4] }}>
          <View style={{ gap: space[2] }}>
            <View
              style={{
                height: 6,
                borderRadius: radius.full,
                backgroundColor: colors.border,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  backgroundColor: colors.success,
                  borderRadius: radius.full,
                }}
              />
            </View>
            <Text style={[type.caption, { color: colors.inkMuted }]}>
              {c.list.progress(doneN, allIds.length)}
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {c.list.chips.map((ch) => (
              <Chip key={ch.label} size="sm" selected={!!ch.selected} count={ch.count}>
                {ch.label}
              </Chip>
            ))}
          </ScrollView>

          {c.list.groups.map((group) => (
            <View key={group.name} style={{ gap: space[2] }}>
              <Text style={[type.overline, { color: colors.inkMuted }]}>{group.name}</Text>
              <View
                style={[
                  {
                    borderRadius: radius.lg,
                    overflow: 'hidden',
                    backgroundColor: colors.border,
                    gap: 1,
                  },
                  elevation[1],
                ]}
              >
                {group.rows.map((row) => (
                  <ListRow
                    key={row.id}
                    checkable
                    checked={!!done[row.id]}
                    title={row.title}
                    subtitle={`${row.qty} · ${row.sub}`}
                    onPress={() => toggle(row.id)}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', right: 16, bottom: bottomPad - 24, zIndex: 4 }}>
        <Fab icon="plus" label={c.list.add} onPress={() => {}} />
      </View>
    </View>
  );
}
