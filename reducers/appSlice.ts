import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AppState {
    language: string;
}

const initialState: AppState = {
    language: "en",
};

export const appSlice = createSlice({
    name: "app",
    initialState,
    reducers: {
        setLanguage: (state, action: PayloadAction<string>) => {
            state.language = action.payload;
        },
    },
});

export const { setLanguage } = appSlice.actions;

export default appSlice.reducer;