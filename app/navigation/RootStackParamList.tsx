import { NavigatorScreenParams } from "@react-navigation/native";
import { BottomTabParamList } from "./BottomTabParamList";
import { Borrowing } from "../services/BorrowingServices";
import { Product } from "../services/ProductServices";

export type RootStackParamList = {
    BottomNavigation: NavigatorScreenParams<BottomTabParamList>;
    OnBoarding: undefined;
    SignUp: undefined;
    SignIn: undefined;
    AccountVerification: undefined;

    Home: undefined;
    Products: undefined;
    ProductDetails: { product: Product };
    PaymentSuccess: { borrowingId: string, collectionCode: string, latitude: number, longitude: number, addressName: string, address: string, postcode: string };
    MyBorrowings: undefined;
    MyBorrowingDetails: { borrowing: Borrowing };
    BorrowerAddReview: { reviewId: string, borrowing: Borrowing };

    ChatList: undefined;
    NewChat: undefined;
    Chat: { chatId: string };
    Profile: undefined;
    PersonalDetails: undefined;
    EditAttributes: { profileAttribute: { attributeName: string } };
    AddressBook: undefined;
    SearchAddress: undefined;
    AddressMapView: { latitude: number, longitude: number, addressName: string, address: string, postcode: string };
    AddAddress: { latitude: any, longitude: any, addressName: string, address: string, postcode: string };
    EditLocationPinPoint: { location: { latitude: any, longitude: any, addressName: string, address: string } }
    PaymentInformation: undefined;

    Search: undefined;
    SearchResults: { query: string, allSearchResults: any };

    // Lender Profile
    MyRequests: undefined;
    MyRequestDetails: { lending: Borrowing };
    LenderAddReview: { reviewId: string, lending: Borrowing };
    MyServices: undefined;
    AddListing: { listing: Product | null };
    ProviderDashboard: undefined;
    Messages: undefined;

    Temp: undefined;

    FavouriteCollection: undefined;

};