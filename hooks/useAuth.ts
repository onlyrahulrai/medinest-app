import { useState, useEffect, useCallback } from 'react';
import { authStorage } from '../utils/authStorage';
import { authService } from '../services/api/auth';

export function useAuth() {
    const [sessionToken, setSessionToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initialize session from secure storage
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
            setError(err.response?.data?.phone || err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loginWithOtp = useCallback(async (phoneNumber: string, otp: string) => {
        setIsLoading(true);

        setError(null);

        try {
            // The API returns a token or user data, adjust as needed
            const result = await authService.loginWithOtp(phoneNumber, otp);
            // If result contains a token, save it
            if (result && result.access) {
                // Store the token as a plain string
                await authStorage.saveToken(result.access);
                setSessionToken(result.access);
            }
            return { success: true };
        } catch (err: any) {
            setError(err.response?.data?.fields?.otp || err.response?.data?.message || 'Failed to verify OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setIsLoading(true);
        try {
            await authStorage.deleteToken();
            setSessionToken(null);
        } catch (err: any) {
            console.error('Logout error', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getUserProfile = useCallback(async () => {
        try {
            const profile = await authService.getProfile();

            console.log('Fetched user profile:', profile);

            return profile;
        } catch (err) {
            console.error('Failed to fetch user profile', err);
            return null;
        }
    }, []);

    return {
        sessionToken,
        isLoading,
        error,
        requestOTP,
        loginWithOtp,
        getUserProfile,
        logout,
    };
}
