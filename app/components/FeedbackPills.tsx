import React from 'react';
import { View, Text } from 'react-native';
import { COLORS } from '../constants/theme';

const FeedbackPills = ({ feedbacks }: { feedbacks: string[] }) => {
  if (!feedbacks || feedbacks.length === 0) return null;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
      {feedbacks.map((item, index) => (
        <View
          key={index}
          style={{
            backgroundColor: COLORS.placeholder,
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 20,
          }}
        >
          <Text style={{ color: COLORS.blackLight2, fontSize: 13, fontWeight: '500' }}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
};

export default FeedbackPills;
