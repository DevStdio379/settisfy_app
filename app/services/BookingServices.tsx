import { db } from './firebaseConfig';
import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, CollectionReference, DocumentReference, setDoc } from 'firebase/firestore';
import { Product2 } from './ProductServices2';
import { Address } from './AddressServices';

export interface Booking {
  id?: string;
  userId: string;
  status: number;
  selectedDate: string;
  selectedAddress: Address;

  // user copy
  firstName: string,
  lastName: string,

  // products copy
  productId?: string;
  title: string;
  imageUrl: string;
  description: string;
  includedServices: string[];
  category: string;
  servicePrice: number;

  // booking details
  total: number;
  paymentMethod: string;
  paymentIntentId?: string;

  // after broadcast
  settlerId?: string;
  settlerFirstName?: string;
  settlerLastName?: string;

  // collection and return code
  serviceStartCode: string;
  serviceEndCode: string;
  createAt: any;
  updatedAt: any;

  // for cleaning service
  extras?: string[];
  notes?: string;
}

export const createBooking = async (bookingData: Booking) => {
  try {
    const bookingRef = collection(db, 'bookings');
    const docRef = await addDoc(bookingRef, bookingData);
    console.log('Booking created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating booking: ', error);
    throw error;
  }
};


const mapBorrowingData = (doc: any): Booking => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    status: data.status,
    selectedDate: data.selectedDate,
    selectedAddress: data.selectedAddress,

    // user copy
    firstName: data.firstName,
    lastName: data.lastName,

    // products copy
    productId: data.productId,
    title: data.title,
    imageUrl: data.imageUrl,
    description: data.description,
    includedServices: data.includedServices,
    category: data.category,
    servicePrice: data.servicePrice,

    // booking details
    total: data.total,
    paymentMethod: data.paymentMethod,
    paymentIntentId: data.paymentIntentId || '',  // Ensure paymentIntentId is always a string

    // after broadcast
    settlerId: data.settlerId || '',
    settlerFirstName: data.settlerFirstName || '',
    settlerLastName: data.settlerLastName || '',

    // collection and return code
    serviceStartCode: data.serviceStartCode,
    serviceEndCode: data.serviceEndCode,
    createAt: data.createAt,
    updatedAt: data.updatedAt,
  };
};

// Function to fetch products for a specific user from Firestore
export const fetchBorrowingsByUser = async (userID: string): Promise<Booking[]> => {
  try {
    const userMyBorrowingsList: Booking[] = [];
    const snapshot = await getDocs(collection(db, 'borrowings')); // Fetch products from 'products' collection
    snapshot.forEach(doc => {
      const borrowingData = doc.data();
      if (borrowingData.userId === userID) {  // Check if the product belongs to the user
        userMyBorrowingsList.push(mapBorrowingData(doc));  // Push the formatted product to the list
      }
    });
    return userMyBorrowingsList;
  } catch (error) {
    console.error('Error fetching user borrowings: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};

export const fetchSelectedBorrowing = async (borrowingId: string): Promise<Booking | null> => {
  try {
    const borrowingRef = doc(db, 'borrowings', borrowingId);
    const borrowingDoc = await getDoc(borrowingRef);

    if (borrowingDoc.exists() && borrowingDoc.data()) {
      return mapBorrowingData(borrowingDoc);
    } else {
      console.log('No such selected borrowing exists.');
      return null;
    }
  } catch (error) {
    console.error('Error fetching selected borrowing: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};

// Function to fetch products for a specific user from Firestore
export const fetchLendingsByUser = async (userID: string): Promise<Booking[]> => {
  try {
    const userMyLendingsList: Booking[] = [];
    const snapshot = await getDocs(collection(db, 'borrowings')); // Fetch products from 'products' collection
    snapshot.forEach(doc => {
      const lendingData = doc.data();
      if (lendingData.product.ownerID === userID) {  // Check if the product belongs to the user
        userMyLendingsList.push(mapBorrowingData(doc));  // Push the formatted product to the list
      }
    });
    return userMyLendingsList;
  } catch (error) {
    console.error('Error fetching user lendings: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};

export const updateBorrowing = async (borrowingId: string, updatedData: Partial<Booking>) => {
  try {
    const borrowingRef = doc(db, 'borrowings', borrowingId);
    await updateDoc(borrowingRef, updatedData);
    console.log('Borrowing updated with ID: ', borrowingId);
  } catch (error) {
    console.error('Error updating borrowing: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};

export const countActivitiesByUser = async (userID: string): Promise<{ borrowingReviews: number, lendingReviews: number }> => {
  try {
    const reviewsRef = collection(db, 'borrowings');

    // Count borrowing reviews
    const borrowingQuery = query(reviewsRef, where('userId', '==', userID));
    const borrowingSnapshot = await getDocs(borrowingQuery);
    const borrowingReviews = borrowingSnapshot.size;

    // Count lending reviews
    const lendingQuery = query(reviewsRef, where('product.ownerID', '==', userID));
    const lendingSnapshot = await getDocs(lendingQuery);
    const lendingReviews = lendingSnapshot.size;

    return { borrowingReviews, lendingReviews };
  } catch (error) {
    console.error('Error counting reviews: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};
