import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { COLORS } from '../../constants/theme'
import { IMAGES } from '../../constants/Images'
import { GlobalStyleSheet } from '../../constants/StyleSheet'
import { useTheme } from '@react-navigation/native'

type Props = {
    id: string;
    title: string;
    subtitle: string;
    onPress: (e: any) => void,
}

const CardInfoStyle = ({ id, title, subtitle, onPress }: Props) => {

    const theme = useTheme();
    const { colors }: { colors: any } = theme;

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            style={{
                flexDirection: 'row',
                width: '100%',
                alignItems: 'flex-start',
                backgroundColor: colors.background,
                borderRadius: 13,
                borderWidth: 1,
                borderColor: COLORS.blackLight,
                padding: 15,
                shadowColor: theme.dark ? colors.background : "rgba(4,118,78,.6)",
                shadowOffset: {
                    width: 0,
                    height: 4,
                },
                shadowOpacity: 0.34,
                shadowRadius: 18.27,
                elevation: 8,
            }}
        >
            <View style={{ paddingVertical: 0 }}>
                <Text style={{ fontSize: 16, color: colors.title }}>{title}</Text>
                <Text style={{ fontSize: 14, color: colors.title }}>{subtitle}</Text>
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    brandsubtitle3: {
        fontSize: 12,
        color: COLORS.title
    },
})



export default CardInfoStyle