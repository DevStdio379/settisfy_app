import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet,
    TouchableOpacity,
    Platform,
    Image
} from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../constants/theme';
import { GlobalStyleSheet } from '../constants/StyleSheet';


type Props = {
    title ?: string,
    leftIcon ?: string,
    leftAction ?: any,
    transparent?:any,
    productId?:string,
    titleLeft?:any,
    titleLeft2?:any,
    titleRight?:any,
    rightIcon1?:any,
    rightIcon2?:any,
    rightIcon3?:string,
    rightIcon4?:any,
    rightIcon5?:any,
    saveButton?:any,
}


const Header = ({title, leftIcon, leftAction,transparent,productId,titleLeft,titleLeft2,titleRight,rightIcon1,rightIcon4,rightIcon2,rightIcon3, rightIcon5, saveButton} : Props) => {

    const theme = useTheme();
    const { colors } : {colors : any} = theme;

    const navigation = useNavigation<any>();

    return (
        <View
            style={[{
                height: 65,
                alignItems:'center',
                justifyContent:'center',
                zIndex:99
            },transparent && {
                position: 'absolute',
                left: 0,
                right: 0,
                borderBottomWidth: 0,
            },Platform.OS === 'ios' && {
                backgroundColor:colors.card
            }]}
        >
             <View style={[GlobalStyleSheet.container, {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 7
                }]}
                >
                    {leftIcon === 'back' && 
                        <TouchableOpacity 
                        onPress={() => leftAction ? leftAction() : navigation.goBack()}
                        style={styles.actionBtn}
                        >
                            <Ionicons size={24} color={COLORS.title} name='chevron-back-outline' />
                        </TouchableOpacity>
                    }
                    <View style={{ flex: 1 }}>
                        {productId
                            ?
                            <Text style={{ fontSize: 24, color: colors.title, textAlign: titleLeft ? 'left' : 'center',paddingLeft:titleLeft2 ? 10 :10,paddingRight:titleRight ? 20 : 0}}><Text style={{color:COLORS.primary}}>e</Text>Bike</Text>
                            :
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.title, textAlign: titleLeft ? 'left' : 'center'}}>{title}</Text>
                        }
                    </View>
                    {rightIcon1 == "search" &&
                        <TouchableOpacity 
                            activeOpacity={0.5} 
                            onPress={() => navigation.navigate('Search')}
                            style={[styles.actionBtn,{}]}
                        >
                            <Ionicons size={20} color={colors.title} name={'search'} />
                        </TouchableOpacity>
                    }
                    {rightIcon2 == "Edit" &&
                        <TouchableOpacity
                            activeOpacity={0.5} 
                            onPress={() => navigation.navigate('EditProfile')}
                            style={[styles.actionBtn,{}]}
                        >
                            <Ionicons size={22} color={colors.title} name={'pencil'} />
                        </TouchableOpacity>
                    }
                    {rightIcon3 == "cart" &&
                        <TouchableOpacity
                            activeOpacity={0.5} 
                            onPress={() => navigation.navigate('MyCart')}
                            style={[styles.actionBtn,{}]}
                        >
                            <Ionicons size={22} color={colors.title} name={'cart-outline'} />
                        </TouchableOpacity>
                    }
                    {rightIcon4 == "home" &&
                        <TouchableOpacity
                            activeOpacity={0.5} 
                            onPress={() => navigation.navigate('DrawerNavigation',{screen : 'Home'} )}
                            style={[styles.actionBtn,{}]}
                        >
                            <Ionicons size={22} color={colors.title} name={'home'} />
                        </TouchableOpacity>
                    }
                    {rightIcon5 == "chat" &&
                        <TouchableOpacity
                            activeOpacity={0.5} 
                            onPress={() => navigation.navigate('DrawerNavigation',{screen : 'Home'} )}
                            style={[styles.actionBtn,{}]}
                        >
                            <Ionicons size={22} color={colors.title} name={'chatbubble-ellipses-outline'} />
                        </TouchableOpacity>
                    }
                    {saveButton &&
                        <TouchableOpacity
                            activeOpacity={0.5} 
                            onPress={() => navigation.navigate('DrawerNavigation',{screen : 'Home'} )}
                            style={[styles.actionBtn,{ paddingRight: 10}]}
                        >
                            <Text style={{ color: COLORS.success, fontWeight:'bold', fontSize: 14 }}>Save</Text>
                        </TouchableOpacity>
                    }
                </View>
        </View>
    )
}

const styles = StyleSheet.create({
    header : {
        height:60,
        backgroundColor:COLORS.card,
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'center',
    },
    title : {
        fontSize:20,
    },
    actionBtn : {
        height: 45,
        width: 45,
        alignItems:'center',
        justifyContent : 'center',
        //backgroundColor:COLORS.card
        // position:'absolute',
        // left:10,
        // top:10,
    }
})

export default Header;