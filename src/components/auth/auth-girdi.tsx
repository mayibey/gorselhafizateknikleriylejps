/**
 * Premium auth girdisi — sol ikon + input + (şifre ise) göster/gizle gözü. Krem temalı, yuvarlak.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { Palette, Radius, Spacing } from '@/constants/theme';

type Props = TextInputProps & {
  ikon: keyof typeof MaterialCommunityIcons.glyphMap;
  sifre?: boolean; // göz toggle'lı şifre alanı
};

export function AuthGirdi({ ikon, sifre, style, ...rest }: Props) {
  const [gizli, setGizli] = useState(true);
  return (
    <View style={styles.kutu}>
      <MaterialCommunityIcons name={ikon} size={20} color={Palette.solukMetin} />
      <TextInput
        style={[styles.girdi, style]}
        placeholderTextColor={Palette.solukMetin}
        secureTextEntry={!!sifre && gizli}
        autoCapitalize={sifre ? 'none' : rest.autoCapitalize}
        {...rest}
      />
      {sifre ? (
        <Pressable onPress={() => setGizli((g) => !g)} hitSlop={10}>
          <MaterialCommunityIcons
            name={gizli ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color={Palette.solukMetin}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  kutu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.three,
    height: 54,
    shadowColor: Palette.kartGolge,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  girdi: {
    flex: 1,
    fontSize: 16,
    color: Palette.anaMetin,
    paddingVertical: 0,
  },
});
