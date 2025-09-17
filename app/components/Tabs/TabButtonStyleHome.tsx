import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@react-navigation/native';

type Props = {
    buttons?: any;
    onClick?: any;
    scrollX?: any;
};

const TabButtonStyleHome = ({ buttons, onClick, scrollX }: Props) => {
    const { colors } = useTheme();
    const [activeIndex, setActiveIndex] = useState(0); // State to track the active button

    const handlePress = (index: number) => {
        setActiveIndex(index); // Set the active index
        if (onClick) {
            onClick(index);
        }
    };

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {buttons.map((btn: any, i: number) => (
                <TouchableOpacity
                    key={btn}
                    style={styles.btn}
                    onPress={() => handlePress(i)}
                >
                    <Text style={{ color: colors.text, paddingBottom: 5,}}>{btn}</Text>
                    {activeIndex === i && <View style={styles.underline} />}
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    btnContainer: {
        height: 25,
        width: '100%',
    },
    underline: {
        height: 3,
        width: '100%',
        backgroundColor: 'black', // Change this to any color you prefer
    },
    btn: {
        paddingRight: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    animatedBtnContainer: {
        height: 45,
        flexDirection: 'row',
        position: 'absolute',
        overflow: 'hidden',
    },
    animatedBtn: {
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default TabButtonStyleHome;
 