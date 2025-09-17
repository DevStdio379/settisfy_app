import { db } from './firebaseConfig'; // Import firebase config
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';

export interface Address {
  id?: string;
  latitude: number;
  longitude: number;
  addressName: string;
  address: string;
  buildingType: string;
  additionalDetails: string;
  postcode: string;
  addressLabel: string;
  instruction: string;
  createAt: any;  // Use the Firebase Timestamp object for createAt
  updatedAt: any;  // Use the Firebase Timestamp object for updatedAt
}

export const saveUserAddress = async (userId: string, addressData: Address) => {
  try {
    const userAddressesRef = collection(db, 'users', userId, 'addresses'); // Create subcollection 'addresses' under each user

    // Save address to Firestore
    const addressToSave = { ...addressData };
    if (!addressToSave.id) {
      delete addressToSave.id;
    }

    await addDoc(userAddressesRef, {
      ...addressToSave,
      createAt: addressData.createAt || serverTimestamp(),
      updatedAt: addressData.updatedAt || serverTimestamp()
    });

    console.log('Address saved successfully!');
  } catch (error) {
    console.error('Error saving address: ', error);
  }
};


export const fetchUserAddresses = async (userId: string) => {
  try {
    const userAddressesRef = collection(db, 'users', userId, 'addresses');
    const querySnapshot = await getDocs(userAddressesRef);

    const addresses: Address[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      addresses.push({
      id: doc.id,
      latitude: data.latitude,
      longitude: data.longitude,
      addressName: data.addressName,
      address: data.address,
      buildingType: data.buildingType,
      additionalDetails: data.additionalDetails,
      postcode: data.postcode,
      addressLabel: data.addressLabel,
      instruction: data.instruction,
      createAt: data.createAt,
      updatedAt: data.updatedAt
      });
    });

    return addresses;
  } catch (error) {
    console.error('Error fetching addresses: ', error);
    return [];
  }
};

export const fetchProductAddresss = async (productOwnerId: string, addressId: string) => {
  try {
    const addressRef = doc(db, 'users', productOwnerId, 'addresses', addressId);
    const addressDoc = await getDoc(addressRef);

    if (addressDoc.exists()) {
      return { id: addressDoc.id, ...addressDoc.data() };
    } else {
      console.log('No such address found!');
      return null;
    }
  } catch (error) {
    console.error('Error fetching address: ', error);
    return null;
  }
};

export const fetchProductAddress = async (productOwnerId: string, addressId: string): Promise<Address | null> => {
  try {
    const productAddressRef = doc(db, 'users', productOwnerId, 'addresses', addressId);
    const productAddressDoc = await getDoc(productAddressRef);

    if (productAddressDoc.exists() && productAddressDoc.data()) {
      const productAddressData = productAddressDoc.data();
      const productAddress: Address = {
        id: productAddressData.id,
        latitude: productAddressData.latitude,
        longitude: productAddressData.longitude,
        addressName: productAddressData.addressName,
        address: productAddressData.address,
        buildingType: productAddressData.buildingType,
        additionalDetails: productAddressData.additionalDetails,
        postcode: productAddressData.postcode,
        addressLabel: productAddressData.addressLabel,
        instruction: productAddressData.instruction,
        createAt: productAddressData.createAt,
        updatedAt: productAddressData.updatedAt
      };
      return productAddress;
    } else {
      console.log('No such seelected product address exists.');
      return null;
    }
  } catch (error) {
    console.error('Error fetching selected product address: ', error);
    throw error;  // Throwing the error to handle it at the call site
  }
};