import { Borrowing } from "../services/BorrowingServices";

export type BottomTabParamList = {

    FavouriteStack: undefined;
    HomeStack: undefined;
    MyBorrowingsStack: undefined;
    MyBorrowingDetails: { borrowing: Borrowing };
    ChatList: undefined;
    Category: undefined;
    ProfileStack: undefined;

    LenderDashboard: undefined;
    MyLendingsStack: undefined;
    LendingDetails: { lending: Borrowing };
    Listings: undefined;
    // ChatList: undefined;
    // Profile: undefined;
};