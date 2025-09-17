import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { COLORS } from '../../constants/theme'
import { GlobalStyleSheet } from '../../constants/StyleSheet'
import { useTheme } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons';


type Props = {
    id: string;
    title: string;
    description: string;
    brand: string;
    price: string;
    image?: any;
    review?: any;
    countnumber?: string;
    onPress?: (e: any) => void,
    onPress2?: (e: any) => void,
}

const Cardstyle2 = ({ id, title, description, image, countnumber, price, onPress, brand, onPress2, review }: Props) => {

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
                backgroundColor: colors.card,
                borderRadius: review ? 0 : 13,
                padding: 15,
                shadowColor: theme.dark ? colors.background : '#121212',
                shadowOffset: {
                    width: 0,
                    height: 4,
                },
                shadowOpacity: 0.34,
                shadowRadius: 18.27,
                elevation: 8,
            }}
        >
            <View style={{ width: '30%', alignItems: 'center' }}>
                <View
                    style={{
                        height: undefined,
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
                        source={{uri: image}}
                    />
                </View>
            </View>
            <View
                style={{
                    width: '70%',
                    paddingLeft: 15,
                }}
            >
                <View style={[GlobalStyleSheet.flex, { alignItems: 'flex-end' }]}>
                    <Text style={{ fontSize: 20, color: colors.title }}>£{price} / day</Text>
                    <View>
                        {/* <LikeBtn
                            onPress={inWishlist().includes(id) ? removeItemFromWishList : onPress2}
                            id={id}
                            inWishlist={inWishlist}
                        /> */}
                    </View>
                </View>
                <View style={{ marginRight: 20 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.title, paddingRight: 25 }}>{title}</Text>
                    <Text style={{ fontSize: 14, color: '#6A6A6A', marginTop: 5 }}>{description}</Text>
                    <View style={{ flexDirection: 'row', paddingTop: 10 }}>
                        <Ionicons name='star' size={22} color={'#121212'} style={{ paddingRight: 5 }} />
                        <Text style={{ fontSize: 16, color: colors.title }}> 4.8 </Text>
                        <View>
                            <Text style={{ fontSize: 16, color: '#6A6A6A' }}>(73)</Text>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    )
}



export default Cardstyle2