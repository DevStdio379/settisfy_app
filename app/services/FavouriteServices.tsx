import { db } from './firebaseConfig'; // Adjust the import according to your firebase configuration
import { collection, query, where, addDoc, getDocs, deleteDoc, DocumentData } from 'firebase/firestore';

interface Favourite {
    serviceId: string;
}
export const addFavourite = async (userId: string, serviceId: string) => {
    const userFavouritesRef = collection(db, 'users', userId, 'favourites');
    await addDoc(userFavouritesRef, { serviceId });
};

export const removeFavourite = async (userId: string, serviceId: string) => {
    const userFavouritesRef = collection(db, 'users', userId, 'favourites');
    const q = query(userFavouritesRef, where('serviceId', '==', serviceId));
    const snapshot = await getDocs(q);
    snapshot.forEach(async (doc: DocumentData) => {
        await deleteDoc(doc.ref);
        await doc.ref.delete();
    });
};