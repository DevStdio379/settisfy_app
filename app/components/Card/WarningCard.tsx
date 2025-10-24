import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../constants/theme';

interface WarningCardProps {
  imageUrls?: string[];
  remark?: string;
  text?: string; // ✅ custom title text
  onPress?: () => void;
}

const IncompletionFlagCard: React.FC<WarningCardProps> = ({
  imageUrls = [],
  remark = '',
  text = 'Customer marked this job as incomplete',
  onPress,
}) => {
  if (!imageUrls.length || !remark) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff6f6',
        borderColor: COLORS.danger || '#ffdddd',
        borderWidth: 1,
        padding: 12,
        borderRadius: 12,
        marginTop: 10,
        width: '100%',
      }}
    >
      {imageUrls[0] ? (
        <Image
          source={{ uri: imageUrls[0] }}
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            marginRight: 12,
            backgroundColor: COLORS.card,
          }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            marginRight: 12,
            backgroundColor: COLORS.card,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="alert-circle-outline" size={24} color={COLORS.danger || 'red'} />
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '700', color: COLORS.title }}>{text}</Text>
        <Text numberOfLines={2} style={{ color: COLORS.blackLight2, marginTop: 4 }}>
          {remark}
        </Text>
      </View>

      <View style={{ marginLeft: 12 }}>
        <Text style={{ color: COLORS.primary, fontWeight: '700' }}>View Report</Text>
      </View>
    </TouchableOpacity>
  );
};

export default IncompletionFlagCard;
