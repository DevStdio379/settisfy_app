import React, { useState } from 'react'
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native'
import { useTheme } from '@react-navigation/native';
import Header from '../../layout/Header';
import { GlobalStyleSheet } from '../../constants/StyleSheet';
import { IMAGES } from '../../constants/Images';
import Input from '../../components/Input/Input';
// import ImagePicker from 'react-native-image-crop-picker';
import { COLORS } from '../../constants/theme';
import { useUser } from '../../context/UserContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootStackParamList';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../services/firebaseConfig";

type EditAttributesScreenProps = StackScreenProps<RootStackParamList, 'EditAttributes'>;

const EditAttributes = ({ navigation, route }: EditAttributesScreenProps) => {
    const { profileAttribute } = route.params
    const theme = useTheme();
    const { colors }: { colors: any } = theme;
    const { user, updateUserData } = useUser();

    const [isFocused, setisFocused] = useState(false)
    const [attributeData, setAttributeData] = useState<string>('');

    // attribute name placeholder
    const attributeMap: { [key: string]: string } = {
        username: 'Username',
        firstname: 'First Name',
        lastname: 'Last Name',
        email: 'Email',
        phonenumber: 'Phone Number'
    };

    const attribute = attributeMap[profileAttribute.attributeName.toLowerCase()] || '';

    const initialAttribute = user?.isActive ? (() => {
        switch (profileAttribute.attributeName.toLowerCase()) {
            case 'username':
                return user?.userName || '';
            case 'firstname':
                return user?.firstName || '';
            case 'lastname':
                return user?.lastName || '';
            case 'email':
                return user?.email || '';
            case 'phonenumber':
                return user?.phoneNumber || '';
            default:
                return '';
        }
    })() : null;

    const handleUpdate = async () => {
        try {
            if (user?.uid) {
                await updateUserData(user.uid, { [profileAttribute.attributeName]: attributeData });
                navigation.goBack(); // Navigation after update
            } else {
                console.error("User ID is undefined");
            }
        } catch (error) {
            console.error("Error updating user:", error);
        }
    };

    return (
        <View style={{ backgroundColor: colors.background, flex: 1 }}>
            <View style={{ height: 60, borderBottomColor: COLORS.card, borderBottomWidth: 1 }}>
                <View
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingHorizontal: 5 }}>
                    <View style={{ flex: 1, alignItems: 'flex-start' }}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={{
                                height: 45, width: 45, alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <Ionicons size={30} color={COLORS.black} name='chevron-back-outline' />
                        </TouchableOpacity>
                    </View>
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.title, textAlign: 'center', marginVertical: 10 }}>{`Edit ${attribute}`}</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        {/* right header element */}
                    </View>
                </View>
            </View>
            <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, marginBottom: 50, paddingTop: 20 }} showsVerticalScrollIndicator={false}>
                <Text style={{ fontSize: 16, color: colors.title, fontWeight: 'bold', marginBottom: 15 }}>{attribute}</Text>
                <Input
                    onFocus={() => setisFocused(true)}
                    onBlur={() => setisFocused(false)}
                    isFocused={isFocused}
                    onChangeText={setAttributeData}
                    backround={colors.card}
                    style={{ borderRadius: 12, backgroundColor: COLORS.input }}
                    inputicon
                    placeholder={initialAttribute === null ? `Enter your ${attribute}` : initialAttribute}
                    keyboardType={attribute === 'Phone Number' ? 'phone-pad' : 'default'}
                />
            </ScrollView>
            <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                <TouchableOpacity
                    style={{ backgroundColor: COLORS.primary, borderRadius: 10, padding: 15, alignItems: 'center' }}
                    onPress={() => {
                        attributeData ? handleUpdate() : Alert.alert("Error", "Invalid attribute data")
                    }}
                >
                    <Text style={{ color: COLORS.card, fontWeight: 'bold' }}>Update Profile</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default EditAttributes