import { caregiverApi } from "@/services/api/caregiverApi";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function ManagedPatients() {
    const [patients, setPatients] = useState([])
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const getCaregiverRelations = async () => {
        setLoading(true);
        try {
            const patients = await caregiverApi.getCaregiverRelations({ role: "caregiver" });

            setPatients(patients);
        } catch (error: any) {
            console.error("Failed to fetch caregivers", error.response.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getCaregiverRelations();
    }, []);

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>People I Care For</Text>
            {patients.map((patient: any) => (
                <View key={patient._id} style={styles.caregiverCard}>
                    <View style={styles.caregiverInfo}>
                        <View style={[styles.avatarPlaceholder, { backgroundColor: '#E0F2FE' }]}>
                            <Ionicons name="person-outline" size={22} color="#666" />
                        </View>
                        <View>
                            <Text style={styles.caregiverName}>{patient.user.name}</Text>
                            <Text style={styles.caregiverRelation}>{patient.user.phone}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.manageBtn}
                        onPress={() => router.push({ pathname: '/caregiver/activity', params: { patientId: patient.user.id, name: patient.user.name } })}
                    >
                        <Text style={styles.manageBtnText}>View Activity</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    )
}

const styles = StyleSheet.create({
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 50,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
        marginLeft: 4,
    },
    caregiverCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    caregiverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        flex: 1,
    },
    caregiverName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    caregiverRelation: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    manageBtn: {
        backgroundColor: '#F0F9FF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    manageBtnText: {
        color: '#0369A1',
        fontSize: 12,
        fontWeight: '600',
    },
});