import React, { useEffect, useRef, useState } from 'react';
import { Text, View, Image, ScrollView, Animated, Platform, SafeAreaView, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { IMAGES } from '../../constants/Images';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootStackParamList';
import { COLORS, SIZES } from '../../constants/theme';
import { GlobalStyleSheet } from '../../constants/StyleSheet';


const DATA = [
    {
        title: "Your Neighbourhood Rental Hub",
        subtitle: "Need it. Rent it. Save more."
    },
    {
        title: "Anything You Need",
        subtitle: "From household essentials to sports gear, party supplies, or tech.\nYou name it, BorrowUp has it."
    },
    {
        title: "Turn Your Items Into Community Value",
        subtitle: "Have something not yet listed? Share it on BorrowUp, earn extra, and make your neighbourhood stronger through sharing."
    }
]

type OnBoardingScreenProps = StackScreenProps<RootStackParamList, 'OnBoarding'>;

const OnBoarding = ({ navigation }: OnBoardingScreenProps) => {

    const theme = useTheme();
    const { colors }: { colors: any } = theme;

    const IndexData = ["01", "02", "03"]

    const IndexImage = [IMAGES.onbording1, IMAGES.onbording2, IMAGES.onbording3]

    const scrollRef = useRef<any>(null);

    const scrollX = useRef(new Animated.Value(0)).current;

    const [sliderIndex, setSliderIndex] = useState<any>(1);

    const onScroll = (event: any) => {
        scrollX.setValue(event.nativeEvent.contentOffset.x);
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        setSliderIndex(Math.round(contentOffsetX / SIZES.width) + 1);
    };

    const scrollToIndex = (index: number) => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ x: index * SIZES.width, animated: true });
        }
    };

    const [imageScale] = useState(new Animated.Value(0));

    useEffect(() => {
        Animated.sequence([
            Animated.timing(imageScale, {
                toValue: 0, // Scale up to 0
                duration: 100, // Animation duration
                useNativeDriver: true, // Add this line for better performance
            }),
            Animated.timing(imageScale, {
                toValue: 1, // Scale back to 1
                duration: 300, // Animation duration
                useNativeDriver: true, // Add this line for better performance
            }),
        ]).start();
    }, [sliderIndex]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View style={{ flex: 1 }}>
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                        <Animated.View
                            style={{
                                flex: 1,
                                transform: [{ scale: imageScale }], // Apply scale transform
                                opacity: 0.8, // Add shadowy opacity
                            }}
                        >
                            <Image
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    position: 'absolute',
                                    resizeMode: 'cover',
                                }}
                                source={IndexImage[sliderIndex - 1]}
                            />
                            <View
                                style={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: 'rgba(0, 0, 0, 0)',
                                }}
                            >
                                <Animated.View
                                    style={{
                                        flex: 1,
                                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                        opacity: 0.8,
                                        transform: [{ scale: imageScale }],
                                    }}
                                />
                            </View>
                        </Animated.View>
                    </View>
                    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                        <View style={[GlobalStyleSheet.container, { padding: 0, marginBottom: 200 }]}>
                            <ScrollView
                                ref={scrollRef}
                                horizontal
                                pagingEnabled
                                scrollEventThrottle={16}
                                decelerationRate="fast"
                                showsHorizontalScrollIndicator={false}
                                onScroll={onScroll}
                            >
                                {DATA.map((data: any, index) => (
                                    <View style={{ width: SIZES.width, ...(Platform.OS === "ios" && { paddingBottom: 35 }) }} key={index}>
                                        {index === 0 && (
                                            <Image
                                                source={IMAGES.appIcon}
                                                style={{
                                                    width: '100%',
                                                    height: 150,
                                                    resizeMode: 'contain',
                                                    marginBottom: 20,
                                                }}
                                            />
                                        )}
                                        <View style={{ paddingHorizontal: 30 }}>
                                            <Text style={[{
                                                fontSize: 24,
                                                textAlign: 'center',
                                                color: COLORS.white
                                            }, { color: COLORS.white }, Platform.OS === 'web' && { textAlign: 'center' }]}>{data.title}</Text>
                                            <Text style={[{
                                                fontSize: 16,
                                                textAlign: 'center',
                                                color: COLORS.text,
                                                paddingHorizontal: 10,
                                                marginTop: 5
                                            }, { color: COLORS.white }, Platform.OS === 'web' && { textAlign: 'center' }]}>{data.subtitle}</Text>
                                        </View>
                                    </View>
                                ))
                                }
                            </ScrollView>
                            <View style={[{
                                alignSelf: 'center',
                                flexDirection: 'row',
                                top: 25,
                            }, Platform.OS === "ios" && {
                                bottom: 0
                            }]} pointerEvents="none">
                                {DATA.map((x: any, i: any) => (
                                    <Indicator i={i} key={i} scrollValue={scrollX} />
                                ))}
                            </View>
                        </View>
                        <View style={[GlobalStyleSheet.container, { padding: 0, paddingHorizontal: 30, paddingBottom: 30 }]}>
                            <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={{
                                backgroundColor: COLORS.primary,
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderRadius: 20,
                                paddingHorizontal: 20,
                                paddingVertical: 20,
                            }}>
                                <Text style={{ fontWeight: 'bold', fontSize: 17, color: COLORS.white }}>Get Started</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

function Indicator({ i, scrollValue }: any) {

    const theme = useTheme();
    const translateX = scrollValue.interpolate({
        inputRange: [-SIZES.width + i * SIZES.width, i * SIZES.width, SIZES.width + i * SIZES.width],
        outputRange: [-20, 0, 20],
    });
    return (
        <View style={{
            height: 10,
            width: 10,
            borderRadius: 5,
            marginHorizontal: 5,
            borderWidth: 1,
            overflow: 'hidden',
            backgroundColor: theme.dark ? 'rgba(255,255,255,0.20)' : 'rgba(0, 0, 0, 0.20)', borderColor: theme.dark ? 'rgba(255,255,255,0.20)' : 'rgba(0, 0, 0, 0.20)'
        }}>
            <Animated.View
                style={{
                    height: '100%',
                    width: '100%',
                    borderRadius: 10, transform: [{ translateX }], backgroundColor: COLORS.primary
                }}
            />
        </View>
    );
}

export default OnBoarding