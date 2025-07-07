// This file is a fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import React from 'react';
import { OpaqueColorValue, StyleProp, ViewStyle } from 'react-native';

// Add your SFSymbol to MaterialIcons mappings here.
const MAPPING = {
  // See MaterialIcons here: https://icons.expo.fyi
  // See SF Symbols in the SF Symbols app on Mac.
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.up': 'keyboard-arrow-up',
  'chevron.down': 'keyboard-arrow-down',
  'info.circle.fill': 'info',
  'message.fill': 'message',
  'person.2.fill': 'group',
  'gear': 'settings',
  'bell.fill': 'notifications',
  'arrow.right.square': 'logout',
  // Added missing mappings
  'person.fill': 'person',
  'doc.text.fill': 'description',
  'clock.fill': 'access-time',
  'pencil': 'edit',
  'calendar': 'event',
  // Added for StrengthsImprovements component
  'checkmark.circle.fill': 'check-circle',
  'exclamationmark.triangle.fill': 'warning',
  // Added for ActionPlan component
  'smartphone': 'smartphone',
  'headphones': 'headphones',
  'doc.text': 'description',
  // Added for ExportOptions component
  'doc.plaintext.fill': 'insert-drive-file',
  'square.and.arrow.up.fill': 'share',
  'calendar.circle.fill': 'event',
  'arrow.2.circlepath': 'refresh',
  'link': 'link',
  // Added for coins feature
  'bitcoinsign.circle.fill': 'monetization-on',
  'calendar.badge.plus': 'event-available',
  // Added for coin transaction icons
  'creditcard.fill': 'credit-card',
  'gift.fill': 'card-giftcard',
  'minus.circle.fill': 'remove-circle',
  'arrow.clockwise': 'refresh',
  'person.crop.circle.fill': 'account-circle',
  'play.circle.fill': 'play-circle-filled',
  'trophy.fill': 'emoji-events',
  'gear.circle.fill': 'settings',
  // Added for video/session features
  'video.circle.fill': 'videocam',
  // Added for security/protection features
  'shield.checkered': 'security',
  // Added for close/cancel actions
  'xmark': 'close',
} as Partial<
  Record<
    import('expo-symbols').SymbolViewProps['name'],
    React.ComponentProps<typeof MaterialIcons>['name']
  >
>;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SFSymbols on iOS, and MaterialIcons on Android and web. This ensures a consistent look across platforms, and optimal resource usage.
 *
 * Icon `name`s are based on SFSymbols and require manual mapping to MaterialIcons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  // @ts-ignore
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
