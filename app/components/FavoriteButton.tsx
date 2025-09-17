// components/FavoriteButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { toggleFavorite } from '../redux/favoriteSlice';
import { COLORS } from '../constants/theme';

type Props = {
  userId: string;
  productId: string;
};

const FavoriteButton: React.FC<Props> = ({ userId, productId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const isFavorite = useSelector((state: RootState) =>
    (state.favorites as { favorites: string[] }).favorites.includes(productId)
  );

  const handleToggle = () => {
    dispatch(toggleFavorite({ userId, productId }));
  };

  return (
    <TouchableOpacity
      onPress={handleToggle}
      style={[styles.button, isFavorite ? styles.remove : styles.add]}
    >
      <Text style={styles.text}>
        {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
  },
  add: {
    backgroundColor: '#4CAF50',
  },
  remove: {
    backgroundColor: '#F44336',
  },
  text: {
    color: 'white',
    textAlign: 'center',
  },
});

export default FavoriteButton;
