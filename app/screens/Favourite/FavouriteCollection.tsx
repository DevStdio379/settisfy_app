import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ScrollView, RefreshControl, Touchable, TouchableOpacity, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { COLORS } from '../../constants/theme';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootStackParamList';
import { useUser } from '../../context/UserContext';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { fetchFavorites } from '../../redux/favoriteSlice';
import { fetchSelectedProduct, Product } from '../../services/ProductServices';
import Cardstyle4 from '../../components/Card/Cardstyle4';

type FavouriteCollectionScreenProps = StackScreenProps<RootStackParamList, 'FavouriteCollection'>

const Map = ({ navigation }: FavouriteCollectionScreenProps) => {

  const { user } = useUser();
  const dispatch = useDispatch<AppDispatch>();
  const favoriteIds = useSelector((state: RootState) => state.favorites.favorites);
  const [products, setProducts] = useState<Record<string, Product | null>>({});

  useEffect(() => {
    dispatch(fetchFavorites(user?.uid || ''));
  }, [dispatch, user?.uid]);

  useEffect(() => {
    const loadProducts = async () => {
      const updates: Record<string, Product | null> = {};
      for (const id of favoriteIds) {
        if (!products[id]) {
          try {
            const product = await fetchSelectedProduct(id);
            updates[id] = product;
          } catch (err) {
            updates[id] = null; // handle deleted product
          }
        }
      }
      setProducts((prev) => ({ ...prev, ...updates }));
    };

    if (favoriteIds.length) loadProducts();
  }, [favoriteIds]);

  if (!user || !user.isActive) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ marginVertical: 10, fontSize: 14 }}>User is not active. Please sign in.</Text>
        <TouchableOpacity
          style={{ padding: 10, paddingHorizontal: 30, backgroundColor: COLORS.primary, borderRadius: 20 }}
          onPress={() => navigation.navigate('SignIn')}
        >
          <Text style={{ color: COLORS.white, fontSize: 16 }}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: COLORS.background, flex: 1 }}>
      <View style={{ height: 60, borderBottomColor: COLORS.card, borderBottomWidth: 1 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingHorizontal: 5 }}>
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            {/* left header element */}
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.title, textAlign: 'center', marginVertical: 10 }}>Saved Product</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            {/* right header element */}
          </View>
        </View>
      </View>
      {favoriteIds.length === 0 ? (
        <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
          <Text>No product saved</Text>
        </View>
      ) : (
        <FlatList
          data={favoriteIds}
          keyExtractor={(id) => id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          renderItem={({ item: productId }) => {
            const product = products[productId];

            if (!product) {
              return (
                <View/>
              );
            }

            return (
              <View style={{ flex: 1, margin: 5 }}>
                <Cardstyle4
                  id={productId}
                  imageUrl={product.imageUrls[0]}
                  price={product.lendingRate}
                  ownerID={product.ownerID}
                  description={product.description}
                  location={product.address}
                  title={product.title}
                  onPress={() => navigation.navigate('ProductDetails', { product: product })}
                  product={true}
                  ratingCount={product.ratingCount} 
                  deposit={product.depositAmount}
                  averageRating={product.averageRating}/>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  empty: {
    textAlign: 'center',
    marginTop: 50,
    fontStyle: 'italic',
  },
  card: {
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    marginTop: 4,
    color: '#666',
  },
});


export default Map;
