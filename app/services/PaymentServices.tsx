import { db } from './firebaseConfig';
import { deleteDoc, updateDoc } from 'firebase/firestore';
import { collection, addDoc, serverTimestamp, getDocs, doc, getDoc } from 'firebase/firestore';

export interface Payment {
    id?: string;
    accountHolder: string;       // Full Name
    bankName: string;            // Issuing Bank
    accountNumber: string;       // Bank Account Number
    accountType: 'personal' | 'business';
    createdAt: any;              // Firebase Timestamp
    updatedAt: any;              // Firebase Timestamp
}

/**
 * Save user's bank/payment details to Firestore
 * Subcollection: users/{userId}/payments
 */
export const saveUserPayment = async (userId: string, paymentData: Payment) => {
    try {
        const userPaymentsRef = collection(db, 'users', userId, 'payments');

        const paymentToSave = { ...paymentData };
        if (!paymentToSave.id) {
            delete paymentToSave.id;
        }

        await addDoc(userPaymentsRef, {
            ...paymentToSave,
            createdAt: paymentData.createdAt || serverTimestamp(),
            updatedAt: paymentData.updatedAt || serverTimestamp(),
        });

        console.log('Payment details saved successfully!');
    } catch (error) {
        console.error('Error saving payment details: ', error);
    }
};

/**
 * Fetch all payment details of a user
 */
export const fetchUserPayments = async (userId: string): Promise<Payment[]> => {
    try {
        const userPaymentsRef = collection(db, 'users', userId, 'payments');
        const querySnapshot = await getDocs(userPaymentsRef);

        const payments: Payment[] = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            payments.push({
                id: docSnap.id,
                accountHolder: data.accountHolder,
                bankName: data.bankName,
                accountNumber: data.accountNumber,
                accountType: data.accountType,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
            });
        });

        return payments;
    } catch (error) {
        console.error('Error fetching payment details: ', error);
        return [];
    }
};

/**
 * Fetch a single payment record by ID (e.g., when editing)
 */
export const fetchSingleUserPayment = async (
    userId: string,
    paymentId: string
): Promise<Payment | null> => {
    try {
        const paymentRef = doc(db, 'users', userId, 'payments', paymentId);
        const paymentDoc = await getDoc(paymentRef);

        if (paymentDoc.exists()) {
            const data = paymentDoc.data();
            return {
                id: paymentDoc.id,
                accountHolder: data.accountHolder,
                bankName: data.bankName,
                accountNumber: data.accountNumber,
                accountType: data.accountType,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
            } as Payment;
        } else {
            console.log('No such payment record found!');
            return null;
        }
    } catch (error) {
        console.error('Error fetching payment record: ', error);
        return null;
    }
};

export const updateUserPayment = async (
    userId: string,
    paymentId: string,
    paymentData: Partial<Payment>
): Promise<boolean> => {
    try {
        const paymentRef = doc(db, 'users', userId, 'payments', paymentId);

        const paymentDoc = await getDoc(paymentRef);
        if (!paymentDoc.exists()) {
            console.log('No such payment record found!');
            return false;
        }

        const dataToUpdate: any = { ...paymentData };
        if (dataToUpdate.id) delete dataToUpdate.id;

        // Note: ensure `updateDoc` is imported from 'firebase/firestore' at the top of the file.
        await updateDoc(paymentRef, {
            ...dataToUpdate,
            updatedAt: serverTimestamp(),
        });

        console.log('Payment updated successfully!');
        return true;
    } catch (error) {
        console.error('Error updating payment: ', error);
        return false;
    }
};

/**
 * Delete a payment record for a user
 * Subcollection: users/{userId}/payments/{paymentId}
 */
export const deleteUserPayment = async (
    userId: string,
    paymentId: string
): Promise<boolean> => {
    try {
        const paymentRef = doc(db, 'users', userId, 'payments', paymentId);
        await deleteDoc(paymentRef);
        console.log('Payment deleted successfully!');
        return true;
    } catch (error) {
        console.error('Error deleting payment: ', error);
        return false;
    }
};