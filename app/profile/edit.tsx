import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getUserProfile, saveUserProfile, UserProfile } from '../../utils/storage';
import { Image } from 'react-native';

const PREDEFINED_CONDITIONS = [
    'Diabetes',
    'Blood Pressure',
    'Thyroid',
    'Heart Disease',
    'Asthma',
    'Arthritis',
    'None'
];

export default function EditProfileScreen() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);

    // Form states
    const [name, setName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [gender, setGender] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [emergencyName, setEmergencyName] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');
    const [emergencyRelation, setEmergencyRelation] = useState('');
    const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
    const [weight, setWeight] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const data = await getUserProfile();
        if (data) {
            setProfile(data);
            setName(data.name);
            setDateOfBirth(data.dateOfBirth ? new Date(data.dateOfBirth) : null);
            setGender(data.gender);
            setWeight(data.weight || '');
            setPhoneNumber(data.phoneNumber);
            setImage(data.image || null);
            if (data.caregivers && data.caregivers.length > 0) {
                setEmergencyName(data.caregivers[0].name);
                setEmergencyPhone(data.caregivers[0].phoneNumber);
                setEmergencyRelation(data.caregivers[0].relation);
            }
            setSelectedConditions(data.conditions || []);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const toggleCondition = (condition: string) => {
        if (condition === 'None') {
            setSelectedConditions(['None']);
            return;
        }

        setSelectedConditions(prev => {
            const current = prev.filter(c => c !== 'None');
            if (current.includes(condition)) {
                return current.filter(c => c !== condition);
            } else {
                return [...current, condition];
            }
        });
    };

    const handleSave = async () => {
        if (!name.trim() || !dateOfBirth || !gender || !phoneNumber.trim()) {
            Alert.alert('Missing Fields', 'Please fill in all required fields.');
            return;
        }

        if (!profile) return;

        setIsSaving(true);
        try {
            const updatedProfile: UserProfile = {
                ...profile,
                name,
                dateOfBirth: dateOfBirth.toISOString(),
                gender,
                weight,
                phoneNumber,
                image: image || undefined,
                caregivers: emergencyName ? [{
                    id: profile.caregivers && profile.caregivers[0]?.id ? profile.caregivers[0].id : Math.random().toString(36).substr(2, 9),
                    name: emergencyName,
                    phoneNumber: emergencyPhone,
                    relation: emergencyRelation || "Other"
                }] : [],
                conditions: selectedConditions,
            };

            await saveUserProfile(updatedProfile);
            router.back();
        } catch (error) {
            console.error('Failed to update profile', error);
            Alert.alert('Error', 'Failed to save changes.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!profile) return <View style={styles.container} />;

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <LinearGradient
                colors={["#065F46", "#064E3B"]}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="close" size={26} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={true}
                bounces={true}
            >
                <View style={styles.imageSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                        {image ? (
                            <Image source={{ uri: image }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Text style={styles.imagePlaceholderText}>{name.charAt(0).toUpperCase() || "U"}</Text>
                            </View>
                        )}
                        <View style={styles.editBadge}>
                            <Ionicons name="camera" size={20} color="white" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.imageHint}>Tap to change profile picture</Text>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.sectionHeader}>Basic Information</Text>

                    <Text style={styles.label}>Full Name *</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholderTextColor="#999"
                    />

                    <Text style={styles.label}>Date of Birth *</Text>
                    <TouchableOpacity
                        style={styles.input}
                        onPress={() => setShowDatePicker(true)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.dobRow}>
                            <Text style={[styles.dobText, !dateOfBirth && styles.dobPlaceholder]}>
                                {dateOfBirth ? `${dateOfBirth.getDate().toString().padStart(2, '0')}/${(dateOfBirth.getMonth() + 1).toString().padStart(2, '0')}/${dateOfBirth.getFullYear()}` : 'DD/MM/YYYY'}
                            </Text>
                            {dateOfBirth && (
                                <Text style={styles.ageHint}>{(() => {
                                    const today = new Date();
                                    let a = today.getFullYear() - dateOfBirth.getFullYear();
                                    const m = today.getMonth() - dateOfBirth.getMonth();
                                    if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) a--;
                                    return `${a} years old`;
                                })()}</Text>
                            )}
                            <Ionicons name="calendar-outline" size={20} color="#999" />
                        </View>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={dateOfBirth || new Date()}
                            mode="date"
                            maximumDate={new Date()}
                            minimumDate={new Date(1920, 0, 1)}
                            onChange={(event, date) => {
                                setShowDatePicker(false);
                                if (date) setDateOfBirth(date);
                            }}
                        />
                    )}

                    <Text style={styles.label}>Weight (kg) *</Text>
                    <TextInput
                        style={styles.input}
                        value={weight}
                        onChangeText={setWeight}
                        keyboardType="number-pad"
                        placeholderTextColor="#999"
                    />

                    <Text style={styles.label}>Gender *</Text>
                    <View style={styles.genderContainer}>
                        {['Male', 'Female', 'Other'].map((g) => (
                            <TouchableOpacity
                                key={g}
                                style={[styles.genderButton, gender === g && styles.genderButtonActive]}
                                onPress={() => setGender(g)}
                            >
                                <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>{g}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.sectionHeader}>Contact Details</Text>

                    <Text style={styles.label}>Phone Number *</Text>
                    <TextInput
                        style={styles.input}
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        placeholderTextColor="#999"
                    />

                    <Text style={styles.sectionHeader}>Emergency Contact (Optional)</Text>

                    <Text style={styles.label}>Contact Name</Text>
                    <TextInput
                        style={styles.input}
                        value={emergencyName}
                        onChangeText={setEmergencyName}
                        placeholderTextColor="#999"
                    />

                    <Text style={styles.label}>Contact Phone</Text>
                    <TextInput
                        style={styles.input}
                        value={emergencyPhone}
                        onChangeText={setEmergencyPhone}
                        keyboardType="phone-pad"
                        placeholderTextColor="#999"
                    />

                    <Text style={styles.label}>Relation</Text>
                    <TextInput
                        style={styles.input}
                        value={emergencyRelation}
                        onChangeText={setEmergencyRelation}
                        placeholderTextColor="#999"
                    />
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.sectionHeader}>Health Conditions</Text>
                    <View style={styles.conditionsGrid}>
                        {PREDEFINED_CONDITIONS.map((condition) => {
                            const isSelected = selectedConditions.includes(condition);
                            return (
                                <TouchableOpacity
                                    key={condition}
                                    style={[styles.conditionChip, isSelected && styles.conditionChipActive]}
                                    onPress={() => toggleCondition(condition)}
                                >
                                    <Text style={[styles.conditionText, isSelected && styles.conditionTextActive]}>
                                        {condition}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    <LinearGradient
                        colors={isSaving ? ['#e0e0e0', '#e0e0e0'] : ['#4CAF50', '#2E7D32']}
                        style={styles.saveButtonGradient}
                    >
                        <Text style={[styles.saveButtonText, isSaving && styles.saveButtonTextDisabled]}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
        paddingBottom: 40,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: 'white',
        letterSpacing: 0.5,
    },
    scrollView: {
        flex: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    imageSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    imagePicker: {
        position: 'relative',
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#4CAF50',
    },
    imagePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#4CAF50',
    },
    imagePlaceholderText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#4CAF50',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
    },
    imageHint: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        paddingBottom: 40,
    },
    formSection: {
        marginBottom: 32,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    dobRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dobText: {
        fontSize: 16,
        color: '#333',
    },
    dobPlaceholder: {
        color: '#999',
    },
    ageHint: {
        fontSize: 13,
        color: '#4CAF50',
        fontWeight: '600',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    genderContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    genderButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    genderButtonActive: {
        borderColor: '#4CAF50',
        backgroundColor: '#E8F5E9',
        borderWidth: 2,
    },
    genderText: {
        fontSize: 15,
        color: '#666',
        fontWeight: '500',
    },
    genderTextActive: {
        color: '#4CAF50',
        fontWeight: '700',
    },
    conditionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    conditionChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    conditionChipActive: {
        backgroundColor: '#E8F5E9',
        borderColor: '#4CAF50',
        borderWidth: 2,
    },
    conditionText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    conditionTextActive: {
        color: '#4CAF50',
        fontWeight: '700',
    },
    footer: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: 'white',
    },
    saveButton: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButtonTextDisabled: {
        color: '#999',
    }
});
