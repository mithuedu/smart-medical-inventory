import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    username: "",
    name: "",
    emailid: "",
    phonenumber: "",
    location: "",
    userCurrentLocation:"",
    role:""
};

export const userinfo = createSlice({
    name: "userinfo",
    initialState,
    reducers: {
        setUserInfo: (state, action) => {
            return { ...state, ...action.payload };
        },
        clearUserInfo: () => {
            return initialState;
        }
    }
});

export const { setUserInfo, clearUserInfo } = userinfo.actions;
export default userinfo.reducer;
