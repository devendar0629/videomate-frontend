import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type T_InitialState = {
    isAuthenticated: boolean | undefined;
    accessToken: string | undefined;
    userInfo:
        | {
              id: string;
              name: string;
              email: string;
              avatar: string;
          }
        | undefined;
};

const initialState: T_InitialState = {
    isAuthenticated: undefined,
    accessToken: undefined,
    userInfo: undefined,
};

export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        login: (
            state,
            action: PayloadAction<Omit<T_InitialState, "isAuthenticated">>
        ) => {
            state.isAuthenticated = true;
            state.accessToken = action.payload.accessToken;
            state.userInfo = action.payload.userInfo;
        },
        logout: (state) => {
            state.isAuthenticated = false;
            state.accessToken = undefined;
            state.userInfo = undefined;
        },
        setAccessToken: (state, action: PayloadAction<string>) => {
            state.accessToken = action.payload;
        },
    },
});

export const { login, logout, setAccessToken } = authSlice.actions;

export default authSlice.reducer;
