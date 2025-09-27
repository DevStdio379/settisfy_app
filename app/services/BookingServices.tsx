import { db } from './firebaseConfig';
import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, CollectionReference, DocumentReference, setDoc, onSnapshot } from 'firebase/firestore';
import { Address } from './AddressServices';
import { Catalogue } from './CatalogueServices';

export interface Acceptor {
  settlerId: string;
  firstName: string;
  lastName: string;
  acceptedAt: string; // store as ISO string, or use Firestore Timestamp if needed
}

export interface Booking {
  id?: string;
  userId: string;
  status: number;
  selectedDate: string;
  selectedAddress: Address;

  // user copy
  firstName: string;
  lastName: string;

  // products copy
  catalogueService: Catalogue;

  // booking details
  total: number;
  paymentMethod: string;
  paymentIntentId?: string;

  // after broadcast
  acceptors?: Acceptor[];
  settlerId?: string;
  settlerFirstName?: string;
  settlerLastName?: string;

  // collection and return code
  serviceStartCode: string;
  serviceEndCode: string;
  createAt: any;
  updatedAt: any;

  // for cleaning service
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
    catalogueService: data.catalogueService,

    // booking details
    total: data.total,
    paymentMethod: data.paymentMethod,
    paymentIntentId: data.paymentIntentId || '',  // Ensure paymentIntentId is always a string

    // after broadcast
    acceptors: data.acceptors,
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

export function subscribeToBookings(setJobs: (booking: Booking[]) => void) {
  const q = query(collection(db, "bookings"), where("status", "==", "0"));
  return onSnapshot(q, (snap) => {
    const jobs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
    setJobs(jobs);
  });
}

export function subscribeToOneBooking(bookingId: string, onUpdate: (booking: Booking | null) => void) {
  const bookingRef = doc(db, "bookings", bookingId);
  return onSnapshot(bookingRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate({ id: docSnap.id, ...docSnap.data() } as Booking);
    } else {
      onUpdate(null); // Job deleted or not found
    }
  });
}

// Function to fetch products for a specific user from Firestore
export const fetchBookingsByUser = async (userID: string): Promise<Booking[]> => {
  try {
    const userMyBorrowingsList: Booking[] = [];
    const snapshot = await getDocs(collection(db, 'bookings')); // Fetch products from 'products' collection
    snapshot.forEach(doc => {
      const bookingData = doc.data();
      if (bookingData.userId === userID) {  // Check if the product belongs to the user
        userMyBorrowingsList.push(mapBorrowingData(doc));  // Push the formatted product to the list
      }
    });
    return userMyBorrowingsList;
  } catch (error) {
    console.error('Error fetching user borrowings: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};

// Function to fetch products for a specific user from Firestore
export const fetchBookingsAsSettler = async (userId: string): Promise<Booking[]> => {
  try {
    const userMyBorrowingsList: Booking[] = [];
    const snapshot = await getDocs(collection(db, 'bookings')); // Fetch products from 'products' collection
    snapshot.forEach(doc => {
      const bookingData = doc.data();
      if (bookingData.settlerId === userId) {  // Check if the product belongs to the user
        userMyBorrowingsList.push(mapBorrowingData(doc));  // Push the formatted product to the list
      }
    });
    return userMyBorrowingsList;
  } catch (error) {
    console.error('Error fetching user borrowings: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};

export const fetchSelectedBooking = async (bookingId: string): Promise<Booking | null> => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingDoc = await getDoc(bookingRef);

    if (bookingDoc.exists() && bookingDoc.data()) {
      return mapBorrowingData(bookingDoc);
    } else {
      console.log('No such selected booking exists.');
      return null;
    }
  } catch (error) {
    console.error('Error fetching selected booking: ', error);
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

export const updateBooking = async (bookingId: string, updatedData: Partial<any>) => {
  try {
    const borrowingRef = doc(db, 'bookings', bookingId);
    await updateDoc(borrowingRef, updatedData);
    console.log('Booking updated with ID: ', bookingId);
  } catch (error) {
    console.error('Error updating booking: ', error);
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
