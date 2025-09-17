import React, { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../constants/theme';
import { useTheme } from '@react-navigation/native';

const LikeBtn = ({wishlist,onPress,inWishlist,id}: any) => {

    const theme = useTheme();
    const { colors } : {colors : any} = theme;

    return (
        <Pressable
            accessible={true}
            accessibilityLabel="Like Btn"
            accessibilityHint="Like this item"
            onPress={() => onPress ? onPress() : ""}
            style={{
            height: 30,
            width: 30,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: wishlist ? COLORS.primary : COLORS.placeholder,
            opacity: 0.8,
            borderRadius: 15,
            }}
        >
            {inWishlist().includes(id) ? (
            <Ionicons size={22} color={COLORS.black} name="bookmark" />
            ) : (
            <Ionicons size={22} color={COLORS.white} name="bookmark-outline" />
            )}
        </Pressable>
    );
}

export default LikeBtn