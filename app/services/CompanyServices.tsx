import { db } from './firebaseConfig';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';

export interface Company {
  id?: string;
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  businessRegNo: string;
  createdAt: any; // Firebase Timestamp
  updatedAt: any; // Firebase Timestamp
}

/**
 * Save new company info for a user
 * Stored in: users/{userId}/company/{companyId}
 */
export const saveCompanyInfo = async (userId: string, companyData: Company) => {
  try {
    const userCompanyRef = collection(db, 'users', userId, 'companyInfo');
    const dataToSave = { ...companyData };
    delete dataToSave.id;

    await addDoc(userCompanyRef, {
      ...dataToSave,
      createdAt: companyData.createdAt || serverTimestamp(),
      updatedAt: companyData.updatedAt || serverTimestamp(),
    });

    console.log('Company information saved successfully!');
  } catch (error) {
    console.error('Error saving company info: ', error);
    throw error;
  }
};

/**
 * Fetch the first (and only) company info of a user.
 * Returns `null` if not found.
 */
export const fetchCompanyInfo = async (userId: string): Promise<Company | null> => {
  try {
    const userCompanyRef = collection(db, 'users', userId, 'companyInfo');
    const querySnapshot = await getDocs(userCompanyRef);

    if (querySnapshot.empty) {
      console.log('No company information found for this user.');
      return null;
    }

    const docSnap = querySnapshot.docs[0];
    const data = docSnap.data();

    const company: Company = {
      id: docSnap.id,
      companyName: data.companyName,
      companyAddress: data.companyAddress,
      companyEmail: data.companyEmail,
      companyPhone: data.companyPhone,
      businessRegNo: data.businessRegNo,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    return company;
  } catch (error) {
    console.error('Error fetching company info: ', error);
    return null;
  }
};

/**
 * Update existing company info for a user
 */
export const updateCompanyInfo = async (
  userId: string,
  companyId: string,
  companyData: Partial<Company>
): Promise<boolean> => {
  try {
    const companyRef = doc(db, 'users', userId, 'companyInfo', companyId);

    const dataToUpdate = { ...companyData };
    delete dataToUpdate.id;

    await updateDoc(companyRef, {
      ...dataToUpdate,
      updatedAt: serverTimestamp(),
    });

    console.log('Company information updated successfully!');
    return true;
  } catch (error) {
    console.error('Error updating company info: ', error);
    return false;
  }
};

/**
 * Delete company info document
 */
export const deleteCompanyInfo = async (
  userId: string,
  companyId: string
): Promise<boolean> => {
  try {
    const companyRef = doc(db, 'users', userId, 'companyInfo', companyId);
    await deleteDoc(companyRef);
    console.log('Company information deleted successfully!');
    return true;
  } catch (error) {
    console.error('Error deleting company info: ', error);
    return false;
  }
};
