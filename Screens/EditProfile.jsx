import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
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
import { colors, typography } from '../components/colors';
import { dashboardAPI } from '../utils/dashboard';
import { approvalAPI } from '../utils/approval';

const EditProfile = ({ navigation, route }) => {
    const { userProfile: initialUserProfile, isReapplication = false, rejectionReason = null } = route.params || {};
    const [loading, setLoading] = useState(false);
    const [fetchingProfile, setFetchingProfile] = useState(isReapplication && !initialUserProfile);
    const [userProfile, setUserProfile] = useState(initialUserProfile);

    // Fetch profile if we don't have it (especially for reapplication)
    useEffect(() => {
        const fetchProfile = async () => {
            if (isReapplication && !userProfile) {
                try {
                    setFetchingProfile(true);
                    const response = await approvalAPI.getProfile();
                    if (response.success) {
                        setUserProfile(response.data);
                    } else {
                        Alert.alert('Error', 'Failed to load profile data');
                        navigation.goBack();
                    }
                } catch (error) {
                    console.error('Failed to fetch profile:', error);
                    Alert.alert('Error', 'Failed to load profile data');
                    navigation.goBack();
                } finally {
                    setFetchingProfile(false);
                }
            }
        };

        fetchProfile();
    }, [isReapplication, userProfile]);

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

            // If this is a reapplication, reset verification status to pending
            if (isReapplication) {
                updateData.deliveryBoyInfo.verificationStatus = 'pending';
                updateData.deliveryBoyInfo.verificationNotes = 'Reapplication submitted for review';
                updateData.deliveryBoyInfo.reappliedAt = new Date().toISOString();
            }

            const response = await dashboardAPI.updateProfile(updateData);

            if (response.success) {
                const successTitle = isReapplication ? 'Reapplication Submitted' : 'Success';
                const successMessage = isReapplication 
                    ? 'Your reapplication has been submitted successfully. Our team will review your updated information and documents.'
                    : 'Profile updated successfully';

                Alert.alert(
                    successTitle,
                    successMessage,
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                if (isReapplication) {
                                    // Navigate to PendingApproval after reapplication
                                    navigation.replace('PendingApproval', { 
                                        user: response.data,
                                        isReapplication: true 
                                    });
                                } else {
                                    navigation.goBack();
                                }
                            }
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

    // Show loading screen while fetching profile
    if (fetchingProfile) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary.yellow2} />
                <Text style={{ marginTop: 16, color: colors.neutrals.gray }}>Loading profile...</Text>
            </View>
        );
    }

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
                <Text style={styles.title}>
                    {isReapplication ? 'Reapply for Verification' : 'Edit Profile'}
                </Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Reapplication Notice */}
                {isReapplication && rejectionReason && (
                    <View style={styles.reapplicationNotice}>
                        <View style={styles.noticeHeader}>
                            <Ionicons name="information-circle" size={20} color="#E53E3E" />
                            <Text style={styles.noticeTitle}>Previous Rejection Reason</Text>
                        </View>
                        <Text style={styles.noticeText}>{rejectionReason}</Text>
                        <Text style={styles.noticeSubtext}>
                            Please review and update your information below to address the rejection reason.
                        </Text>
                    </View>
                )}

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

                    {/* Documents Button for Reapplication */}
                    {isReapplication && (
                        <TouchableOpacity
                            style={styles.documentsButton}
                            onPress={() => navigation.navigate('Documents', { isReapplication: true })}
                        >
                            <View style={styles.documentsButtonContent}>
                                <Ionicons name="document-text-outline" size={20} color={colors.primary.yellow2} />
                                <Text style={styles.documentsButtonText}>Update Documents</Text>
                                <Ionicons name="chevron-forward" size={16} color={colors.neutrals.gray} />
                            </View>
                            <Text style={styles.documentsButtonSubtext}>
                                Upload new or updated documents to address rejection issues
                            </Text>
                        </TouchableOpacity>
                    )}

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
                            <Ionicons name={isReapplication ? "send" : "checkmark"} size={20} color="white" />
                            <Text style={styles.saveButtonText}>
                                {isReapplication ? 'Submit Reapplication' : 'Save Changes'}
                            </Text>
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
    reapplicationNotice: {
        backgroundColor: '#FFF5F5',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: '#E53E3E',
    },
    noticeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    noticeTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E53E3E',
        marginLeft: 8,
    },
    noticeText: {
        fontSize: 14,
        color: '#E53E3E',
        marginBottom: 8,
        lineHeight: 20,
    },
    noticeSubtext: {
        fontSize: 12,
        color: '#B91C1C',
        fontStyle: 'italic',
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
    documentsButton: {
        borderWidth: 1,
        borderColor: colors.primary.yellow2,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        backgroundColor: '#FFFBEB',
    },
    documentsButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    documentsButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.primary.yellow2,
        marginLeft: 8,
        flex: 1,
    },
    documentsButtonSubtext: {
        fontSize: 12,
        color: colors.neutrals.gray,
        marginTop: 4,
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
