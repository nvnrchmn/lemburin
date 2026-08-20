import { Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '@/hooks/use-app-theme';

type SelectionOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

type SelectionSheetProps<T extends string> = {
  visible: boolean;
  title: string;
  value?: T;
  options: SelectionOption<T>[];
  onSelect: (value: T) => void | Promise<void>;
  onClose: () => void;
};

export function SelectionSheet<T extends string>({
  visible,
  title,
  value,
  options,
  onSelect,
  onClose,
}: SelectionSheetProps<T>) {
  const { colors } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: colors.overlay }}
        onPress={onClose}
      >
        <Pressable
          className="rounded-t-[32px] px-5 pt-4 pb-10"
          style={{ backgroundColor: colors.card }}
          onPress={event => event.stopPropagation()}
        >
          <View
            className="w-10 h-1 rounded-full self-center mb-5"
            style={{ backgroundColor: colors.border }}
          />
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-sans-bold" style={{ color: colors.text }}>
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tutup"
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.background }}
              onPress={onClose}
            >
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          <View style={{ gap: 10 }}>
            {options.map(option => {
              const selected = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  className="rounded-2xl px-4 py-4 flex-row items-center"
                  style={{
                    backgroundColor: selected ? 'rgba(51, 128, 255, 0.12)' : colors.background,
                    borderColor: selected ? '#3380FF' : colors.border,
                    borderWidth: 1,
                  }}
                  onPress={async () => {
                    await onSelect(option.value);
                    onClose();
                  }}
                >
                  <View
                    className="w-11 h-11 rounded-2xl items-center justify-center mr-4"
                    style={{ backgroundColor: selected ? 'rgba(51, 128, 255, 0.18)' : colors.card }}
                  >
                    <Ionicons
                      name={option.icon || 'options-outline'}
                      size={21}
                      color={selected ? '#3380FF' : colors.muted}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-sans-bold" style={{ color: colors.text }}>
                      {option.label}
                    </Text>
                    {option.description ? (
                      <Text className="text-xs mt-1" style={{ color: colors.muted }}>
                        {option.description}
                      </Text>
                    ) : null}
                  </View>
                  {selected ? <Ionicons name="checkmark-circle" size={24} color="#3380FF" /> : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
