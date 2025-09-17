import { Borrowing } from "../services/BorrowingServices";

export type BottomTabParamList = {

    FavouriteStack: undefined;
    HomeStack: undefined;
    MyBorrowingsStack: undefined;
    MyBorrowingDetails: { borrowing: Borrowing };
    ChatList: undefined;
    Category: undefined;
    ProfileStack: undefined;

    ProviderDashboard: undefined;
    MyServices: undefined;
    MyRequestsStack: undefined;
    MyRequestDetails: { lending: Borrowing };
    // ChatList: undefined;
    // Profile: undefined;
};