import React, { useState } from 'react'
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Platform, Linking } from 'react-native'
import { useTheme } from '@react-navigation/native';
import { GlobalStyleSheet } from '../../constants/StyleSheet';
import { COLORS, SIZES } from '../../constants/theme';
import { useUser } from '../../context/UserContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootStackParamList';

type PaymentInformationScreenProps = StackScreenProps<RootStackParamList, 'PaymentInformation'>;

const PaymentInformation = ({ navigation }: PaymentInformationScreenProps) => {

    const theme = useTheme();
    const { colors }: { colors: any } = theme;
    const { user } = useUser();

    return (
        <View style={{ backgroundColor: colors.background, flex: 1 }}>
            <View>
                <View style={{ zIndex: 1, height: 60, backgroundColor: COLORS.background, borderBottomColor: COLORS.card, borderBottomWidth: 1 }}>
                    <View style={{ height: '100%', backgroundColor: COLORS.background, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingHorizontal: 10 }}>
                        <View style={{ flex: 1, alignItems: 'flex-start' }}>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={{
                                    height: 40,
                                    width: 40,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Ionicons size={30} color={COLORS.black} name='chevron-back-outline' />
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={{ width: 200, fontSize: 18, fontWeight: 'bold', color: COLORS.title, textAlign: 'center' }}>Payment Information</Text>
                        </View>
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        </View>
                    </View>
                </View>
            </View>
            <ScrollView contentContainerStyle={{ width: SIZES.width, marginBottom: 50, }}>
                <View style={{ marginTop: 50, paddingHorizontal: 15 }}>
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ fontSize: 14, color: COLORS.text, textAlign: 'center', marginBottom: 10 }}>
                            For your security, we do not store card details in the app. All payment information is securely managed by Stripe.
                        </Text>
                        <TouchableOpacity
                            style={{
                                backgroundColor: COLORS.primary,
                                paddingVertical: 10,
                                paddingHorizontal: 20,
                                borderRadius: 8,
                                alignSelf: 'center',
                            }}
                            onPress={() => {
                                // Replace with your Stripe link
                                const stripeLink = 'https://dashboard.stripe.com/';
                                Linking.openURL(stripeLink);
                            }}
                        >
                            <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: 'bold' }}>
                                Manage Cards on Stripe
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    icon: {
        height: 30,
        width: 45,
        resizeMode: 'contain',
        backgroundColor: COLORS.primaryLight,
        borderColor: COLORS.primary,
        borderWidth: 0.5,
        borderRadius: 1
    },
    inputBox: {
        borderRadius: 12,
        backgroundColor: COLORS.input,
    },
    cardBackground: {
        marginTop: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.background,
        marginHorizontal: -15,
        paddingHorizontal: 15,
        paddingBottom: 15,
        marginBottom: 10
    },
    imageborder: {
        borderWidth: 2,
        borderColor: COLORS.primary,
        height: 90,
        width: 90,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center'
    },
    WriteIconBackground: {
        height: 42,
        width: 42,
        borderRadius: 40,
        backgroundColor: COLORS.card,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 0,
        left: 60
    },
    WriteIcon: {
        height: 36,
        width: 36,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary
    },
    InputTitle: {

        fontSize: 13,
        color: COLORS.title,
        marginBottom: 5
    },
    bottomBtn: {
        height: 75,
        width: '100%',
        backgroundColor: COLORS.card,
        justifyContent: 'center',
        paddingHorizontal: 15,
        shadowColor: "#000",
        shadowOffset: {
            width: 2,
            height: 2,
        },
        shadowOpacity: .1,
        shadowRadius: 5,
    }
})


export default PaymentInformation