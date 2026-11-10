import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGuestSession } from '@/components/GuestSession';
import { useLocale } from '@/components/LocaleProvider';
import { useTheme } from '@/components/ThemeProvider';
import { AppHeader, Chip, Fab, IconButton, ListRow } from '@/components/ui';
import { copy } from '@/lib/i18n/copy';

/** Artboard 08 — Shopping checklist persisted in guest store. */
export default function ChecklistScreen() {
  const { locale } = useLocale();
  const { colors, type, space, radius, elevation } = useTheme();
  const { shoppingItems, toggleShoppingItem, addShoppingItem, recipes } = useGuestSession();
  const insets = useSafeAreaInsets();
  const c = copy(locale);
  const hi = locale === 'hi';
  const [filter, setFilter] = useState<string>('all');

  const items = useMemo(() => {
    if (filter === 'all') return shoppingItems;
    return shoppingItems.filter((i) => i.recipeId === filter);
  }, [shoppingItems, filter]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof items>();
    items.forEach((item) => {
      const key = hi && item.aisleHi ? item.aisleHi : item.aisle;
      const list = map.get(key) || [];
      list.push(item);
      map.set(key, list);
    });
    return Array.from(map.entries());
  }, [items, hi]);

  const doneN = shoppingItems.filter((i) => i.checked).length;
  const total = shoppingItems.length;
  const pct = total ? Math.round((doneN / total) * 100) : 0;
  const bottomPad = 12 + 72 + 24 + insets.bottom;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }}>
        <AppHeader
          variant="large"
          eyebrow={
            hi
              ? `${recipes.length} रेसिपी से`
              : `From ${recipes.length || 0} recipes`
          }
          title={c.list.title}
          actions={<IconButton icon="share" label={c.list.share} variant="surface" />}
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
              {c.list.progress(doneN, total)}
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            <Chip
              size="sm"
              selected={filter === 'all'}
              count={shoppingItems.length}
              onPress={() => setFilter('all')}
            >
              {hi ? 'सभी' : 'All'}
            </Chip>
            {recipes.slice(0, 4).map((r) => (
              <Chip
                key={r.id}
                size="sm"
                selected={filter === r.id}
                count={shoppingItems.filter((i) => i.recipeId === r.id).length || undefined}
                onPress={() => setFilter(r.id)}
              >
                {hi && r.titleHi ? r.titleHi : r.title}
              </Chip>
            ))}
          </ScrollView>

          {groups.length === 0 ? (
            <Text style={[type.body, { color: colors.inkMuted }]}>
              {hi
                ? 'सूची खाली है। रेसिपी से सामग्री जोड़ें।'
                : 'List is empty. Add ingredients from a recipe.'}
            </Text>
          ) : (
            groups.map(([name, rows]) => (
              <View key={name} style={{ gap: space[2] }}>
                <Text style={[type.overline, { color: colors.inkMuted }]}>{name}</Text>
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
                  {rows.map((row) => (
                    <ListRow
                      key={row.id}
                      checkable
                      checked={row.checked}
                      title={hi && row.nameHi ? row.nameHi : row.name}
                      subtitle={[row.qty, hi && row.recipeTitleHi ? row.recipeTitleHi : row.recipeTitle]
                        .filter(Boolean)
                        .join(' · ')}
                      onPress={() => void toggleShoppingItem(row.id)}
                    />
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', right: 16, bottom: bottomPad - 24, zIndex: 4 }}>
        <Fab
          icon="plus"
          label={c.list.add}
          onPress={() => void addShoppingItem(hi ? 'नया आइटम' : 'New item')}
        />
      </View>
    </View>
  );
}
