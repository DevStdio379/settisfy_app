import { db } from './firebaseConfig'; // Adjust the import according to your firebase configuration
import { collection, query, where, addDoc, getDocs, deleteDoc, DocumentData } from 'firebase/firestore';

interface Favourite {
    productId: string;
}
export const addFavourite = async (userId: string, productId: string) => {
    const userFavouritesRef = collection(db, 'users', userId, 'favourites');
    await addDoc(userFavouritesRef, { productId });
};

export const removeFavourite = async (userId: string, productId: string) => {
    const userFavouritesRef = collection(db, 'users', userId, 'favourites');
    const q = query(userFavouritesRef, where('productId', '==', productId));
    const snapshot = await getDocs(q);
    snapshot.forEach(async (doc: DocumentData) => {
        await deleteDoc(doc.ref);
        await doc.ref.delete();
    });
};