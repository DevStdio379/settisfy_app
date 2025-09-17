import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { COLORS } from '../../constants/theme'
import { useTheme } from '@react-navigation/native'

type Props = {
    id: string;
    title: string;
    onPress: (e: any) => void,
}

const PillStyle = ({ id, title, onPress }: Props) => {

    const theme = useTheme();
    const { colors }: { colors: any } = theme;

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                backgroundColor: colors.background,
                borderRadius: 30,
                borderWidth: 1,
                borderColor: COLORS.blackLight,
                alignContent: 'center',
                justifyContent: 'center',
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
            <View style={{ padding: 10 }}>
                <Text style={{ fontSize: 12, color: colors.title }}>{title}</Text>
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



export default PillStyle