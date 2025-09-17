import { View, Text, Image, StyleSheet, TouchableOpacity, TouchableNativeFeedback, Pressable } from 'react-native'
import React, { useEffect, useState } from 'react'
import { COLORS } from '../../constants/theme'
import { IMAGES } from '../../constants/Images'
import { GlobalStyleSheet } from '../../constants/StyleSheet'
import { useTheme } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons';
import LikeBtn from '../LikeBtn'
import { useUser } from '../../context/UserContext'
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../../services/firebaseConfig'
import FavoriteButton from '../FavoriteButton'
import { AppDispatch, RootState } from '../../redux/store'
import { useDispatch, useSelector } from 'react-redux'
import { toggleFavorite } from '../../redux/favoriteSlice'

type Props = {
    id: string;
    title: string;
    btntitle?: string;
    price: number;
    ownerID?: string;
    description?: string;
    location?: string;
    deposit: number;
    imageUrl?: any;
    product?: any;
    MyOrder?: any;
    completed?: any;
    averageRating?: number;
    ratingCount?: number;
    onPress?: (e: any) => void,
    onPress2?: any,
    onPress3?: (e: any) => void,
    onPress4?: (e: any) => void,
    onPress5?: (e: any) => void,
}

const Cardstyle4 = ({ id, title, imageUrl, description, deposit, averageRating, ratingCount, price, onPress, ownerID, product, onPress2, MyOrder, btntitle, completed, location, onPress5, onPress3, onPress4 }: Props) => {

    const theme = useTheme();
    const { colors }: { colors: any } = theme;


    const { user } = useUser();
    const dispatch = useDispatch<AppDispatch>();
    const isFavorite = useSelector((state: RootState) =>
        (state.favorites as { favorites: string[] }).favorites.includes(id)
    );

    const handleToggle = () => {
        if (!user) return;
        dispatch(toggleFavorite({ userId: user?.uid, productId: id }));
    };

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            style={[styles.card, { flexDirection: 'column', width: 180, alignItems: 'flex-start', borderRadius: 22, padding: 5 }]}
        >
            <View style={{ width: '100%', alignItems: 'center' }}>
                <View
                    style={{
                        height: 200,
                        width: '100%',
                        backgroundColor: COLORS.primary,
                        borderRadius: 22,
                        aspectRatio: 1 / 1.2,
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}
                >
                    <Image
                        style={{ height: undefined, width: '100%', aspectRatio: 1 / 1.2, }}
                        source={{ uri: imageUrl }}
                    />
                    <View
                        style={{
                            position: 'absolute',
                            right: 10,
                            top: 10,
                        }}
                    >
                        <TouchableOpacity
                            onPress={handleToggle}
                            style={{
                                height: 30,
                                width: 30,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: COLORS.placeholder,
                                opacity: 0.8,
                                borderRadius: 15,
                            }}
                        >
                            {isFavorite ? (
                                <Ionicons size={22} color={COLORS.black} name="bookmark" />
                            ) : (
                                <Ionicons size={22} color={COLORS.white} name="bookmark-outline" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={{ flex: 1, width: '100%' }}>
                    <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 16, color: COLORS.black }}>{title}</Text>
                    <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 13, color: COLORS.black }}>{location?.split(',').slice(0, 2).join(',')}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-start', width: '100%' }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 14, color: colors.title }}>£{price}/day</Text>
                        <Text style={{ fontWeight: 'bold', fontSize: 14, color: COLORS.placeholder }}> • </Text>
                        <Text style={{ fontSize: 13, color: COLORS.blackLight2, textDecorationLine: 'underline' }}>£{Number(deposit) + Number(price)} total</Text>
                    </View>
                    {MyOrder ? completed ?
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={onPress4}
                            style={{
                                padding: 10,
                                paddingHorizontal: 15,
                                backgroundColor: COLORS.primary,
                                borderRadius: 30,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 10
                            }}
                        >
                            <Text style={{ fontSize: 14, color: COLORS.card, lineHeight: 21 }}>{btntitle}</Text>
                        </TouchableOpacity>
                        :
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={onPress3}
                            style={{
                                padding: 10,
                                paddingHorizontal: 20,
                                backgroundColor: COLORS.primary,
                                borderRadius: 30,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 10
                            }}
                        >
                            <Text style={{ fontSize: 14, color: COLORS.card, lineHeight: 21 }}>{btntitle}</Text>
                        </TouchableOpacity>
                        :
                        <Text style={{ fontSize: 12, color: COLORS.blackLight }}>
                            {averageRating && averageRating > 0 ? `★ ${averageRating.toFixed(1)} (${ratingCount})` : 'No rating'}
                        </Text>
                    }
                </View>
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    brandsubtitle3: {

        fontSize: 12,
        color: COLORS.title
    },
    buttonWrapper: {
        borderRadius: 30,
        overflow: 'hidden', // Prevent ripple from bleeding outside the button
    },
    button: {
        flexDirection: 'row',
        padding: 10,
        paddingHorizontal: 25,
        backgroundColor: COLORS.card,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10
    },
    card: {

    },
})



export default Cardstyle4

