import { db } from './firebaseConfig';
import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, CollectionReference, DocumentReference, setDoc } from 'firebase/firestore';
import { Product } from './ProductServices';
import { Address } from './AddressServices';

export interface Borrowing {
  id?: string;
  userId: string;
  status: number;
  startDate: string;
  endDate: string;
  // user copy
  firstName: string,
  lastName: string,
  // owner copy
  ownerFirstName: string,
  ownerLastName: string,
  product: Product;

  total: number;
  deliveryMethod: string;
  numberOfDays: number;
  paymentMethod: string;
  paymentIntentId?: string;
  // collection and return code
  collectionCode: string;
  returnCode: string;
  createAt: any;
  updatedAt: any;
}

export const createBorrowing = async (borrowingRef: DocumentReference, borrowingData: Borrowing) => {
  try {
    // Ensure no undefined fields in the product object
    const sanitizedBorrowingData = {
      ...borrowingData,
      product: {
        ...borrowingData.product,
        averageRating: borrowingData.product.averageRating ?? null,
        ratingCount: borrowingData.product.ratingCount ?? null, // Replace undefined with null
      },
    };

    await setDoc(borrowingRef, sanitizedBorrowingData);
    console.log('Borrowing created with ID: ', borrowingRef.id);
    return borrowingRef.id;
  } catch (error) {
    console.error('Error placing borrowing: ', error);
  }
};


const mapBorrowingData = (doc: any): Borrowing => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    status: data.status,
    startDate: data.startDate,
    endDate: data.endDate,
    // user copy
    firstName: data.firstName,
    lastName: data.lastName,
    // owner copy
    ownerFirstName: data.ownerFirstName,
    ownerLastName: data.ownerLastName,
    // products copy
    product: data.product,
    // end address copy
    total: data.total,
    deliveryMethod: data.deliveryMethod,
    numberOfDays: data.numberOfDays,
    paymentMethod: data.paymentMethod,
    paymentIntentId: data.paymentIntentId || '',  // Ensure paymentIntentId is always a string
    // collection and return code
    collectionCode: data.collectionCode,
    returnCode: data.returnCode,
    createAt: data.createAt,
    updatedAt: data.updatedAt,
  };
};

// Function to fetch products for a specific user from Firestore
export const fetchBorrowingsByUser = async (userID: string): Promise<Borrowing[]> => {
  try {
    const userMyBorrowingsList: Borrowing[] = [];
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

export const fetchSelectedBorrowing = async (borrowingId: string): Promise<Borrowing | null> => {
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
export const fetchLendingsByUser = async (userID: string): Promise<Borrowing[]> => {
  try {
    const userMyLendingsList: Borrowing[] = [];
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

export const updateBorrowing = async (borrowingId: string, updatedData: Partial<Borrowing>) => {
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
