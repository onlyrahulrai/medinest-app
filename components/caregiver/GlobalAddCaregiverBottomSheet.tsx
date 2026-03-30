import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAddCaregiver } from '../../hooks/useCaregiverHooks';
import { caregiverEvents } from '../../utils/events';
import { useCaregiverValidation } from '../../hooks/useCaregiverValidation';
import { useTranslation } from 'react-i18next';

export default function GlobalAddCaregiverBottomSheet() {
    const [isVisible, setIsVisible] = useState(false);
    const [newCaregiverName, setNewCaregiverName] = useState("");
    const [newCaregiverPhone, setNewCaregiverPhone] = useState("");
    const [newCaregiverRelation, setNewCaregiverRelation] = useState("");
    const [showRelationModal, setShowRelationModal] = useState(false);

    const { t } = useTranslation();
    const { addCaregiver, isSubmitting: isActionLoading } = useAddCaregiver();
    const { phoneError, lookupStatus, isLookingUp, validateAndLookup, foundName } = useCaregiverValidation();

    const RELATION_OPTIONS = [
        { label: t("onboarding.step3.form.relations.father") || "Father", value: "Father" },
        { label: t("onboarding.step3.form.relations.mother") || "Mother", value: "Mother" },
        { label: t("onboarding.step3.form.relations.brother") || "Brother", value: "Brother" },
        { label: t("onboarding.step3.form.relations.sister") || "Sister", value: "Sister" },
        { label: t("onboarding.step3.form.relations.spouse") || "Spouse", value: "Spouse" },
        { label: t("onboarding.step3.form.relations.friend") || "Friend", value: "Friend" },
        { label: t("onboarding.step3.form.relations.other") || "Other", value: "Other" },
    ];

    useEffect(() => {
        const handleOpen = () => setIsVisible(true);
        const handleClose = () => {
             setIsVisible(false);
             resetForm();
        };

        caregiverEvents.on('openAddCaregiverSheet', handleOpen);
        caregiverEvents.on('closeAddCaregiverSheet', handleClose);

        return () => {
            caregiverEvents.off('openAddCaregiverSheet', handleOpen);
            caregiverEvents.off('closeAddCaregiverSheet', handleClose);
        };
    }, []);

    useEffect(() => {
        if (foundName) {
            setNewCaregiverName(foundName);
        }
    }, [foundName]);

    const resetForm = () => {
        setNewCaregiverName("");
        setNewCaregiverPhone("");
        setNewCaregiverRelation("");
    };

    const handleAddCaregiver = async () => {
        if (!newCaregiverPhone || phoneError) return;

        try {
            await addCaregiver({
                caregiverName: newCaregiverName || foundName,
                caregiverPhone: newCaregiverPhone,
                relation: newCaregiverRelation || "Other"
            });

            Alert.alert("Success", "Caregiver invitation has been sent/updated.");
            setIsVisible(false);
            resetForm();
        } catch (error: any) {
            Alert.alert("Error", error?.message || "Failed to add caregiver");
        }
    };

    return (
        <Modal visible={isVisible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add Caregiver</Text>
                        <TouchableOpacity onPress={() => setIsVisible(false)}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <View style={[styles.inputContainer, phoneError ? styles.inputContainerError : null]}>
                        <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.modalInput}
                            placeholder="e.g. 9876543210"
                            value={newCaregiverPhone}
                            onChangeText={(text) => validateAndLookup(text, setNewCaregiverPhone)}
                            keyboardType="phone-pad"
                            maxLength={10}
                            placeholderTextColor="#999"
                        />
                        {isLookingUp && <ActivityIndicator size="small" color="#4CAF50" />}
                    </View>
                    
                    {phoneError ? (
                        <View style={styles.feedbackRow}>
                            <Ionicons name="close-circle" size={16} color="#D32F2F" />
                            <Text style={styles.errorText}>{phoneError}</Text>
                        </View>
                    ) : null}

                    {lookupStatus === 'found' && !isLookingUp ? (
                        <View style={styles.feedbackRow}>
                            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                            <Text style={styles.successText}>Registered user found</Text>
                        </View>
                    ) : null}

                    {lookupStatus === 'not-found' && !isLookingUp && newCaregiverPhone.length === 10 && !phoneError ? (
                        <View style={styles.notFoundCard}>
                            <View style={styles.feedbackRow}>
                                <Ionicons name="alert-circle" size={16} color="#F57F17" />
                                <Text style={styles.warningText}>Unregistered User</Text>
                            </View>
                            <Text style={styles.notFoundHint}>They will receive an SMS invitation to join.</Text>
                        </View>
                    ) : null}

                    <Text style={styles.inputLabel}>Name</Text>
                    <View style={styles.inputContainer}>
                         <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.modalInput}
                            placeholder="e.g. Jane Doe"
                            value={newCaregiverName}
                            onChangeText={setNewCaregiverName}
                            placeholderTextColor="#999"
                        />
                    </View>

                    <Text style={styles.inputLabel}>Relation</Text>
                    <TouchableOpacity
                        style={styles.inputContainer}
                        onPress={() => setShowRelationModal(true)}
                    >
                        <Ionicons name="people-outline" size={20} color="#666" style={styles.inputIcon} />
                        <View style={styles.dropdownInput}>
                            <Text style={[styles.relationTextValue, !newCaregiverRelation && styles.placeholderText]}>
                                {newCaregiverRelation || "Select Relation"}
                            </Text>
                        </View>
                        <Ionicons name="chevron-down" size={20} color="#999" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.saveBtn, (!newCaregiverPhone || !newCaregiverRelation || phoneError || isActionLoading || isLookingUp) && styles.saveBtnDisabled]}
                        onPress={handleAddCaregiver}
                        disabled={!newCaregiverPhone || !newCaregiverRelation || !!phoneError || isActionLoading || isLookingUp}
                    >
                        {isActionLoading ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Save Caregiver</Text>}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Relation Selection Modal */}
            <Modal
                visible={showRelationModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowRelationModal(false)}
            >
                <TouchableOpacity
                    style={styles.relationModalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowRelationModal(false)}
                >
                    <View style={styles.relationModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Relation</Text>
                            <TouchableOpacity onPress={() => setShowRelationModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.relationsList}>
                            {RELATION_OPTIONS.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.relationOption,
                                        newCaregiverRelation === option.value && styles.relationOptionActive,
                                    ]}
                                    onPress={() => {
                                        setNewCaregiverRelation(option.value);
                                        setShowRelationModal(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.relationOptionText,
                                            newCaregiverRelation === option.value && styles.relationOptionTextActive,
                                        ]}
                                    >
                                        {option.label}
                                    </Text>
                                    {newCaregiverRelation === option.value && (
                                        <Ionicons name="checkmark" size={20} color="#4CAF50" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </Modal>
    );
}

const styles = StyleSheet.create({
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
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        paddingHorizontal: 16,
    },
    inputContainerError: {
        borderColor: '#D32F2F',
    },
    inputIcon: {
        marginRight: 10,
    },
    modalInput: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: '#333',
    },
    saveBtn: {
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 32,
    },
    saveBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    saveBtnDisabled: {
        backgroundColor: '#ccc',
    },
    feedbackRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
    },
    errorText: {
        fontSize: 13,
        color: '#D32F2F',
    },
    successText: {
        fontSize: 13,
        color: '#4CAF50',
        fontWeight: '500',
    },
    warningText: {
       fontSize: 13,
       color: '#F57F17',
       fontWeight: '500',
    },
    notFoundCard: {
        backgroundColor: '#FFF8E1',
        borderRadius: 10,
        padding: 12,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#FFE082',
    },
    notFoundHint: {
       fontSize: 12,
       color: '#795548',
       marginTop: 6,
    },
    dropdownInput: {
        flex: 1,
        paddingVertical: 16,
    },
    relationTextValue: {
        fontSize: 16,
        color: '#333',
    },
    placeholderText: {
        color: '#999',
    },
    relationModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    relationModalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '70%',
        padding: 24,
    },
    relationsList: {
        marginBottom: 20,
    },
    relationOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
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
    }
});
