import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
    user: Record<string, any> | null;
    token:  {
        access: string;
        refresh: string;
    };
    loading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    token: {
        access: "",
        refresh: ""
    },
    loading: false,
    error: null,
};

export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        authenticated: (state, action: Record<string, any>) => {
            const {access, refresh, ...user} = action.payload;
            state.user = user;
            state.token = {
                access,
                refresh
            };
            state.error = null;
            state.loading = false;
        },
        loaded: (state, action: PayloadAction<{ user: Record<string, any> }>) => {
            state.user = action.payload;
        },
        logout: (state) => {
            state.user = null;
            state.token = {
                access: "",
                refresh: ""
            };
            state.error = null;
            state.loading = false;
        },
        // Deprecated: kept for backward compatibility
        edit: (state, action: PayloadAction<Record<string, any>>) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        },
    }
})

export const {
    authenticated,
    loaded,
    logout,
    edit,
} = authSlice.actions;

export default authSlice.reducer;