import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Platform
} from 'react-native';
import { colors } from '../components/colors';
import { dashboardAPI } from '../utils/dashboard';

const EditProfile = ({ navigation, route }) => {
    const { userProfile } = route.params;
    const [loading, setLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: userProfile?.name || '',
        fullName: userProfile?.deliveryBoyInfo?.personalInfo?.fullName || '',
        phoneNumber: userProfile?.phoneNumber || '',
        address: userProfile?.deliveryBoyInfo?.personalInfo?.address || '',
        emergencyContact: userProfile?.deliveryBoyInfo?.personalInfo?.emergencyContact?.mobileNumber || '',
        panNumber: userProfile?.deliveryBoyInfo?.identification?.panNumber || '',
        vehicleNumber: userProfile?.deliveryBoyInfo?.vehicleInfo?.vehicleNumber || '',
        vehicleType: userProfile?.deliveryBoyInfo?.vehicleInfo?.type || 'motorcycle',
        experienceYears: userProfile?.deliveryBoyInfo?.experience?.years?.toString() || '0'
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        try {
            setLoading(true);

            // Prepare update data
            const updateData = {
                name: formData.name,
                deliveryBoyInfo: {
                    personalInfo: {
                        fullName: formData.fullName,
                        mobileNumber: formData.phoneNumber.replace('+91', ''),
                        address: formData.address,
                        emergencyContact: {
                            mobileNumber: formData.emergencyContact
                        }
                    },
                    identification: {
                        panNumber: formData.panNumber
                    },
                    vehicleInfo: {
                        type: formData.vehicleType,
                        vehicleNumber: formData.vehicleNumber
                    },
                    experience: {
                        years: parseInt(formData.experienceYears) || 0
                    }
                }
            };

            const response = await dashboardAPI.updateProfile(updateData);

            if (response.success) {
                Alert.alert(
                    'Success',
                    'Profile updated successfully',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.goBack()
                        }
                    ]
                );
            } else {
                Alert.alert('Error', response.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Update profile error:', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false }) => (
        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{label}</Text>
            <TextInput
                style={[styles.input, multiline && styles.multilineInput]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.neutrals.gray}
                keyboardType={keyboardType}
                multiline={multiline}
                numberOfLines={multiline ? 3 : 1}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="white" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.neutrals.dark} />
                </TouchableOpacity>
                <Text style={styles.title}>Edit Profile</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Basic Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Basic Information</Text>

                    <InputField
                        label="Display Name"
                        value={formData.name}
                        onChangeText={(value) => handleInputChange('name', value)}
                        placeholder="Enter your display name"
                    />

                    <InputField
                        label="Full Name"
                        value={formData.fullName}
                        onChangeText={(value) => handleInputChange('fullName', value)}
                        placeholder="Enter your full name"
                    />

                    <InputField
                        label="Phone Number"
                        value={formData.phoneNumber}
                        onChangeText={(value) => handleInputChange('phoneNumber', value)}
                        placeholder="Enter phone number"
                        keyboardType="phone-pad"
                    />

                    <InputField
                        label="Address"
                        value={formData.address}
                        onChangeText={(value) => handleInputChange('address', value)}
                        placeholder="Enter your address"
                        multiline={true}
                    />

                    <InputField
                        label="Emergency Contact"
                        value={formData.emergencyContact}
                        onChangeText={(value) => handleInputChange('emergencyContact', value)}
                        placeholder="Emergency contact number"
                        keyboardType="phone-pad"
                    />
                </View>

                {/* Professional Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Professional Information</Text>

                    <InputField
                        label="PAN Number"
                        value={formData.panNumber}
                        onChangeText={(value) => handleInputChange('panNumber', value.toUpperCase())}
                        placeholder="Enter PAN number"
                    />

                    <InputField
                        label="Vehicle Number"
                        value={formData.vehicleNumber}
                        onChangeText={(value) => handleInputChange('vehicleNumber', value.toUpperCase())}
                        placeholder="Enter vehicle number"
                    />

                    <InputField
                        label="Experience (Years)"
                        value={formData.experienceYears}
                        onChangeText={(value) => handleInputChange('experienceYears', value)}
                        placeholder="Years of experience"
                        keyboardType="numeric"
                    />
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : (
                        <>
                            <Ionicons name="checkmark" size={20} color="white" />
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 45,

    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutrals.lightGray,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.neutrals.dark,
    },
    headerRight: {
        width: 40,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.neutrals.dark,
        marginBottom: 16,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.neutrals.dark,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.neutrals.lightGray,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: colors.neutrals.dark,
        backgroundColor: 'white',
    },
    multilineInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary.yellow2,
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 32,
    },
    saveButtonDisabled: {
        backgroundColor: colors.neutrals.gray,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        marginLeft: 8,
    },
});

export default EditProfile;
