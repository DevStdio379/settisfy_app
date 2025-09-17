import React from 'react';
import { View, Text } from 'react-native';
import { COLORS } from '../../constants/theme';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootStackParamList';

type ProductsScreenProps = StackScreenProps<RootStackParamList, 'Products'>

const Products = ({ navigation }: ProductsScreenProps) => {
    return (
    <View style={{ backgroundColor: COLORS.background, flex: 1 }}>
        <Text> PRODUCTS SCREEN</Text>
    </View>
    );
};

export default Products;