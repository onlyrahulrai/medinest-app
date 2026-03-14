import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { clearAllData, getUserProfile, saveUserProfile, UserProfile } from '../../utils/storage';
import { useAuth } from '../../hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const router = useRouter();
    const { logout } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [vibrationEnabled, setVibrationEnabled] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const data = await getUserProfile();
        if (data) {
            setProfile(data);
            setSoundEnabled(data.soundEnabled);
            setVibrationEnabled(data.vibrationEnabled);
        }
    };

    const handleSoundChange = async (value: boolean) => {
        setSoundEnabled(value);
        if (profile) {
            const updated = { ...profile, soundEnabled: value };
            setProfile(updated);
            await saveUserProfile(updated);
        }
    };

    const handleVibrationChange = async (value: boolean) => {
        setVibrationEnabled(value);
        if (profile) {
            const updated = { ...profile, vibrationEnabled: value };
            setProfile(updated);
            await saveUserProfile(updated);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to log out? Your notifications will be paused.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        await logout();
                        router.replace('/login');
                    }
                }
            ]
        );
    };

    const handleClearData = () => {
        Alert.alert(
            "Reset App Data",
            "This will permanently delete all your medications, history, and profile. This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Erase Everything",
                    style: "destructive",
                    onPress: async () => {
                        await clearAllData();
                        await logout();
                        router.replace('/login');
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={true}
                bounces={true}
            >

                <Text style={styles.sectionTitle}>Notifications</Text>
                <View style={styles.card}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="volume-high-outline" size={24} color="#333" style={styles.settingIcon} />
                            <View>
                                <Text style={styles.settingTitle}>Sound Alerts</Text>
                                <Text style={styles.settingDescription}>Play sounds for reminders</Text>
                            </View>
                        </View>
                        <Switch
                            value={soundEnabled}
                            onValueChange={handleSoundChange}
                            trackColor={{ false: '#e0e0e0', true: '#A5D6A7' }}
                            thumbColor={soundEnabled ? '#4CAF50' : '#f4f3f4'}
                        />
                    </View>
                    <View style={[styles.settingRow, styles.borderTop]}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="phone-portrait-outline" size={24} color="#333" style={styles.settingIcon} />
                            <View>
                                <Text style={styles.settingTitle}>Vibration</Text>
                                <Text style={styles.settingDescription}>Vibrate phone on alerts</Text>
                            </View>
                        </View>
                        <Switch
                            value={vibrationEnabled}
                            onValueChange={handleVibrationChange}
                            trackColor={{ false: '#e0e0e0', true: '#A5D6A7' }}
                            thumbColor={vibrationEnabled ? '#4CAF50' : '#f4f3f4'}
                        />
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/profile')}>
                        <Ionicons name="person-outline" size={24} color="#333" style={styles.settingIcon} />
                        <Text style={styles.actionTitle}>My Profile</Text>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" style={styles.chevron} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionRow, styles.borderTop]} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={24} color="#f44336" style={styles.settingIcon} />
                        <Text style={[styles.actionTitle, { color: '#f44336' }]}>Log Out</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Danger Zone</Text>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.actionRow} onPress={handleClearData}>
                        <Ionicons name="trash-outline" size={24} color="#f44336" style={styles.settingIcon} />
                        <View>
                            <Text style={[styles.actionTitle, { color: '#f44336' }]}>Reset All Data</Text>
                            <Text style={styles.settingDescription}>Erases all local medications & profile data</Text>
                        </View>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: 8,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    scrollView: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 150,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#999',
        textTransform: 'uppercase',
        marginBottom: 8,
        marginTop: 24,
        marginLeft: 4,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingIcon: {
        marginRight: 16,
        width: 24,
        textAlign: 'center',
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 14,
        color: '#666',
    },
    borderTop: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        flex: 1,
    },
    chevron: {
        marginLeft: 'auto',
    }
});
