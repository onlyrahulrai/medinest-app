import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';
import { authReducer, appReducer, networkReducer } from '../reducers';

// 🔐 Auth Persist
const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['user', 'token'],
  blacklist: ['loading'], // Don't persist session restoring flag or network info
};

// ⚙️ App Persist (language, settings)
const appPersistConfig = {
  key: 'app',
  storage: AsyncStorage,
  whitelist: ['language'],
};


const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  app: persistReducer(appPersistConfig, appReducer),
  network: networkReducer, // ❌ NOT persisted
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }), // Example: Disable serializable checks if necessary
  devTools: process.env.EXPO_PUBLIC_ENV !== 'production', // Enable Redux DevTools in development
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;