import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { UserProfile } from '../../utils/storage';
import { Image } from 'react-native';
import { useSelector } from 'react-redux';
import { useAuth } from '@/hooks/useAuth';
import { uploadFile } from '@/services/api/common';

const PREDEFINED_CONDITIONS = [
    'Diabetes',
    'Blood Pressure',
    'Thyroid',
    'Heart Disease',
    'Asthma',
    'Arthritis',
    'None'
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function EditProfileScreen() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);

    // Form states
    const [name, setName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [gender, setGender] = useState('');
    const [phone, setPhone] = useState('');
    const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
    const [email, setEmail] = useState("")
    const [bloodGroup, setBloodGroup] = useState("")
    const [showBloodGroupPicker, setShowBloodGroupPicker] = useState(false);
    const [bio, setBio] = useState("");
    const [address, setAddress] = useState("");
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [pic, setPic] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const user = useSelector((state: any) => state.auth.user);
    const { editUserProfile } = useAuth();

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        if (user) {
            setProfile(user);
            setName(user.name || '');
            setDateOfBirth(user?.profile?.dateOfBirth ? new Date(user.profile.dateOfBirth) : null);
            setGender(user?.profile?.gender || '');
            setWeight(String(user?.profile?.weight || 0));
            setHeight(String(user?.profile?.height || 0));
            setPhone(user.phone || '');
            setEmail(user.email || '');
            setBloodGroup(user?.profile?.bloodGroup || '');
            setBio(user?.profile?.bio || '');
            setAddress(user?.profile?.address || '');
            setPic(user?.profile?.pic || null);
            setSelectedConditions(user?.profile?.conditions || []);
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
            const asset = result.assets[0];

            const fileToUpload = {
                uri: asset.uri,
                name: asset.fileName || `image_${Date.now()}.jpg`,
                type: asset.mimeType || 'image/jpeg',
            };

            try {
                const res = await uploadFile({ type: "single", file: fileToUpload }) as any;
                if (res.data?.file?.url) {
                    setPic(res.data.file.url);
                }
            } catch (error) {
                console.error("Failed to upload image", error);
                Alert.alert("Upload Error", "Could not upload the profile image. Please try again.");
            }
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
        if (!name.trim() || !dateOfBirth || !gender || !phone.trim()) {
            Alert.alert('Missing Fields', 'Please fill in all required fields.');
            return;
        }

        if (!profile) return;

        setIsSaving(true);

        try {
            const profile: Record<string, any> = {
                bio,
                dateOfBirth: dateOfBirth.toISOString(),
                gender,
                weight: Number(weight),
                height: Number(height),
                bloodGroup,
                conditions: selectedConditions,
                address
            }

            if (pic) {
                profile.pic = pic;
            }

            const updatedProfile = {
                name,
                phone,
                email,
                profile
            }

            const result = await editUserProfile(updatedProfile);

            if (result?.message) {
                Alert.alert(
                    "Oops",
                    result.message || "Failed to update profile. Please try again.",
                );
                return;
            }

            if (result?.success) {
                Alert.alert(
                    "Success",
                    result.message || "Profile updated successfully.",
                );
                router.back();
            }

            if (result?.fields) {
                setFieldErrors(result.fields);
            }

        } catch (error) {
            console.error('Failed to update profile', error);
            Alert.alert('Oops', 'Failed to save changes. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!profile) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <Ionicons name="alert-circle-outline" size={60} color="#f44336" />
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginTop: 16 }}>Profile Not Found</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 24, padding: 12, backgroundColor: '#065F46', borderRadius: 8 }}>
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

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
                            {pic ? (
                                <Image source={{ uri: pic }} style={styles.profileImage} />
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

                        <Text style={styles.label}>Height (cm)</Text>
                        <TextInput
                            style={styles.input}
                            value={height}
                            onChangeText={setHeight}
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
                        <Text style={styles.label}>Phone Number *</Text>
                        <TextInput
                            style={[styles.input, fieldErrors.phone && styles.inputError]}
                            value={phone}
                            onChangeText={(text) => {
                                setPhone(text);
                                if (fieldErrors.phone) {
                                    setFieldErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors.phone;
                                        return newErrors;
                                    });
                                }
                            }}
                            keyboardType="phone-pad"
                            placeholderTextColor="#999"
                        />
                        {fieldErrors.phone && <Text style={styles.errorText}>{fieldErrors.phone}</Text>}

                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={[styles.input, fieldErrors.email && styles.inputError]}
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (fieldErrors.email) {
                                    setFieldErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors.email;
                                        return newErrors;
                                    });
                                }
                            }}
                            keyboardType="email-address"
                            placeholderTextColor="#999"
                        />
                        {fieldErrors.email && <Text style={styles.errorText}>{fieldErrors.email}</Text>}

                        <Text style={styles.label}>Blood Group</Text>
                        <TouchableOpacity
                            style={styles.input}
                            onPress={() => setShowBloodGroupPicker(true)}
                        >
                            <View style={styles.selectRow}>
                                <Text style={[styles.selectText, !bloodGroup && styles.placeholderText]}>
                                    {bloodGroup || 'Select Blood Group'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#999" />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.label}>Bio</Text>
                        <TextInput
                            style={styles.input}
                            value={bio}
                            onChangeText={setBio}
                            placeholderTextColor="#999"
                        />
                        <Text style={styles.label}>Address</Text>
                        <TextInput
                            style={styles.input}
                            value={address}
                            onChangeText={setAddress}
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

                {/* Blood Group Picker Modal */}
                <Modal
                    visible={showBloodGroupPicker}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowBloodGroupPicker(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowBloodGroupPicker(false)}
                    >
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select Blood Group</Text>
                                <TouchableOpacity onPress={() => setShowBloodGroupPicker(false)}>
                                    <Ionicons name="close" size={24} color="#333" />
                                </TouchableOpacity>
                            </View>
                            <ScrollView>
                                {BLOOD_GROUPS.map((group) => (
                                    <TouchableOpacity
                                        key={group}
                                        style={[
                                            styles.relationOption,
                                            bloodGroup === group && styles.relationOptionActive
                                        ]}
                                        onPress={() => {
                                            setBloodGroup(group);
                                            setShowBloodGroupPicker(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.relationOptionText,
                                            bloodGroup === group && styles.relationOptionTextActive
                                        ]}>{group}</Text>
                                        {bloodGroup === group && <Ionicons name="checkmark" size={20} color="#4CAF50" />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </Modal>
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
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '60%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    relationOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    relationOptionActive: {
        backgroundColor: '#E8F5E9',
        borderRadius: 8,
        borderBottomWidth: 0,
    },
    relationOptionText: {
        fontSize: 16,
        color: '#333',
    },
    relationOptionTextActive: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    inputError: {
        borderColor: '#DC2626',
    },
    errorText: {
        color: '#DC2626',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    selectRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectText: {
        fontSize: 16,
        color: '#333',
    },
    placeholderText: {
        color: '#999',
    },
});
