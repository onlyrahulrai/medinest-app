import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface NetworkState {
    isConnected: boolean;
    type: string | null;
    isInternetReachable?: boolean; // Optional, can be added later if needed
}

const initialState: NetworkState = {
    isConnected: false,
    type: null,
    isInternetReachable: false,
};

export const networkSlice = createSlice({
    name: "network",
    initialState,
    reducers: {
        setNetworkInfo: (state, action: PayloadAction<{ isConnected: boolean; type: string; isInternetReachable?: boolean }>) => {
            state.isConnected = action.payload.isConnected;
            state.type = action.payload.type;
            state.isInternetReachable = action.payload.isInternetReachable;
        },
    },
});

export const { setNetworkInfo } = networkSlice.actions;

export default networkSlice.reducer;