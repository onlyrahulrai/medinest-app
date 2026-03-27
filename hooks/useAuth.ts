import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { authStorage } from '../utils/authStorage';
import { authService } from '../services/api/auth';
import {
    authenticated,
    loaded
} from '../reducers';

export function useAuth() {
    const dispatch = useDispatch();
    const [sessionToken, setSessionToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initialize session from secure storage on app launch
    useEffect(() => {
        const loadSession = async () => {
            try {
                const token = await authStorage.getToken();

                if (token) {
                    setSessionToken(token);
                }
            } catch (err) {
                console.error('Failed to load session token', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadSession();
    }, []);

    const requestOTP = useCallback(async (phoneNumber: string) => {
        setIsLoading(true);
        setError(null);

        try {
            await authService.sendOtp(phoneNumber);
            return { success: true };
        } catch (err: any) {
            console.log('OTP request error', err);

            const errorMessage =
                err.response?.data?.phone ||
                err.response?.data?.message ||
                'Failed to send OTP. Please try again.';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loginWithOtp = useCallback(
        async (phoneNumber: string, otp: string) => {
            setIsLoading(true);
            setError(null);

            try {
                const result = await authService.loginWithOtp(phoneNumber, otp);

                // Store access token securely
                if (result?.access) {
                    await authStorage.saveToken(result.access);
                    setSessionToken(result.access);
                }

                // Dispatch to Redux for global state
                dispatch(
                    authenticated(result)
                );

                return {
                    success: true,
                    data: result,
                };
            } catch (err: any) {
                console.log('Login error', err);

                const errorMessage =
                    err.response?.data?.fields?.otp ||
                    err.response?.data?.message ||
                    'Failed to verify OTP. Please try again.';
                setError(errorMessage);
                return { success: false, error: errorMessage };
            } finally {
                setIsLoading(false);
            }
        },
        [dispatch]
    );

    const logout = useCallback(async () => {
        setIsLoading(true);
        try {
            await authService.logout();
            await authStorage.deleteToken();
            setSessionToken(null);
            // dispatch(setSessionRestoring(false));
        } catch (err: any) {
            console.error('Logout error', err);
        } finally {
            setIsLoading(false);
        }
    }, [dispatch]);

    const getUserProfile = useCallback(async () => {
        try {
            const profile = await authService.getProfile();

            return { success: true, data: profile };
        } catch (err) {
            return { success: false, data: null };
        }
    }, []);

    const editUserProfile = useCallback(async (data: Record<string, any>) => {
        try {
            const result = await authService.editProfile(data);

            dispatch(loaded(result));

            return { success: true, data: result };
        } catch (err: any) {
            return err.response?.data;
        }
    }, []);

    return {
        sessionToken,
        isLoading,
        error,
        requestOTP,
        loginWithOtp,
        editUserProfile,
        getUserProfile,
        logout,
    };
}
