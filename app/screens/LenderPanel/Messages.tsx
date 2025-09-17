import React from 'react'
import { View, Text } from 'react-native'
import { COLORS } from '../../constants/theme';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootStackParamList';

type MessagesScreenProps = StackScreenProps<RootStackParamList, 'Messages'>;

const Messages = ({ navigation }: MessagesScreenProps) => {
    return (
        <View style={{ backgroundColor: COLORS.card, flex: 1 }}>
            <Text> MESSAGES SCREEN</Text>
        </View>
    )
}

export default Messages