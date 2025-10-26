import React from 'react';
import { View, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../constants/theme';

interface InfoBarProps {
  icon?: string;
  title: string;
  subtitle?: string;
  backgroundColor?: string;
  borderColor?: string;
  iconColor?: string;
}

const InfoBar: React.FC<InfoBarProps> = ({
  icon = 'alert-circle-outline',
  title,
  subtitle,
  backgroundColor = COLORS.primaryLight || '#FFF8E1',
  borderColor = COLORS.primary,
  iconColor = COLORS.primary,
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor,
        borderRadius: 12,
        padding: 12,
        marginVertical: 10,
        borderWidth: 1,
        borderColor,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <Ionicons name={icon} size={20} color={iconColor} />
        <View style={{ paddingLeft: 10, flex: 1 }}>
          <Text style={{ fontSize: 14, color: COLORS.title, fontWeight: '600' }}>{title}</Text>
          {subtitle ? (
            <Text style={{ fontSize: 12, color: COLORS.black, marginTop: 4 }}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default InfoBar;
