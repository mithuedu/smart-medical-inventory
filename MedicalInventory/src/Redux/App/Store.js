import { configureStore } from '@reduxjs/toolkit';
import userinfo from '../Slice/UserInfo';
export const store = configureStore({
    reducer: {
        userinfo
    },
});
