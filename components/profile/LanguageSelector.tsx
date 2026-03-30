import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import '../../utils/i18n';

const LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
];

export default function LanguageSelector() {
    const { i18n } = useTranslation();
    const [showModal, setShowModal] = useState(false);
    const [selectedCode, setSelectedCode] = useState(i18n.language || 'en');

    const currentLanguage = LANGUAGES.find(l => l.code === selectedCode) || LANGUAGES[0];

    const handleLanguageSelect = async (code: string) => {
        setSelectedCode(code);
        await i18n.changeLanguage(code);
        await AsyncStorage.setItem('user-language', code);
        setShowModal(false);
    };

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionIconContainer}>
                        <Ionicons name="language" size={15} color="#2563EB" />
                    </View>
                    <Text style={styles.sectionTitle}>Language</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.selectorCard}
                onPress={() => setShowModal(true)}
                activeOpacity={0.7}
            >
                <View style={styles.currentLanguageRow}>
                    <Text style={styles.flagEmoji}>{currentLanguage.flag}</Text>
                    <View style={styles.languageInfo}>
                        <Text style={styles.languageName}>{currentLanguage.name}</Text>
                        <Text style={styles.languageNative}>{currentLanguage.nativeName}</Text>
                    </View>
                </View>
                <View style={styles.changeRow}>
                    <Text style={styles.changeText}>Change</Text>
                    <Ionicons name="chevron-forward" size={16} color="#2563EB" />
                </View>
            </TouchableOpacity>

            {/* Language Selection Modal */}
            <Modal
                visible={showModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowModal(false)}
                >
                    <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
                        {/* Handle Bar */}
                        <View style={styles.handleBar} />

                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Language</Text>
                            <TouchableOpacity
                                onPress={() => setShowModal(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={22} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>
                            Choose your preferred language for the app
                        </Text>

                        <View style={styles.languageList}>
                            {LANGUAGES.map((lang) => {
                                const isSelected = selectedCode === lang.code;
                                return (
                                    <TouchableOpacity
                                        key={lang.code}
                                        style={[
                                            styles.languageOption,
                                            isSelected && styles.languageOptionSelected
                                        ]}
                                        onPress={() => handleLanguageSelect(lang.code)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.languageOptionInfo}>
                                            <Text style={styles.optionFlag}>{lang.flag}</Text>
                                            <View>
                                                <Text style={[
                                                    styles.optionName,
                                                    isSelected && styles.optionNameSelected
                                                ]}>
                                                    {lang.name}
                                                </Text>
                                                <Text style={styles.optionNative}>{lang.nativeName}</Text>
                                            </View>
                                        </View>
                                        {isSelected && (
                                            <View style={styles.selectedCheck}>
                                                <Ionicons name="checkmark-circle" size={24} color="#059669" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
        marginLeft: 4,
        marginRight: 4,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionIconContainer: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
        letterSpacing: -0.3,
    },
    selectorCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#EFF6FF',
    },
    currentLanguageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    flagEmoji: {
        fontSize: 28,
    },
    languageInfo: {
        // flex container
    },
    languageName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 1,
    },
    languageNative: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    changeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    changeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2563EB',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    },
    handleBar: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E5E7EB',
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.5,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        marginBottom: 24,
        lineHeight: 20,
    },
    languageList: {
        gap: 12,
    },
    languageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 18,
        borderRadius: 18,
        backgroundColor: '#F9FAFB',
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
    },
    languageOptionSelected: {
        backgroundColor: '#F0FDF4',
        borderColor: '#34D399',
    },
    languageOptionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    optionFlag: {
        fontSize: 32,
    },
    optionName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    optionNameSelected: {
        color: '#065F46',
        fontWeight: '700',
    },
    optionNative: {
        fontSize: 14,
        color: '#6B7280',
    },
    selectedCheck: {
        // container for checkmark
    },
});
