import { Image, Modal, SafeAreaView, StyleSheet, Text, TextInput, View, ScrollView, TouchableOpacity, Linking } from 'react-native'
import React, { useEffect, useState } from 'react'
import { COLOR_PRIMARY, COLOR_TEXT_BODY, COLOR_WHITE_1 } from '../../utils/constant'
import { ios, windowHeight, windowWidth } from '../../utils/helper'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Button } from 'react-native-paper'
import { supabase } from '../../config'
import Monicon from '@monicon/native'
import { VersionData } from '../../types'
import DeviceInfo from 'react-native-device-info'
import { useFocusEffect } from '@react-navigation/native'

const SplashScreen = ({ navigation }: any) => {
    const [showModal, setShowModal] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [visible, setVisible] = useState(false);
    const [versionData, setVersionData] = useState<VersionData | null>(null);
    const currentVersion = DeviceInfo.getVersion();
    useEffect(() => {
        checkForUpdates().then(hasUpdate => {
            if (!hasUpdate) {
                checkAdminPassword();
            }
        });
    }, [visible])

    const checkForUpdates = async (): Promise<boolean> => {
        try {
            const { data, error } = await supabase
                .from('update_version')
                .select('*')
                .eq('os_name', ios ? 'ios' : 'android')
                .limit(1);

            if (error) {
                console.error('Error fetching version data:', error);
                return false;
            }

            if (data && data.length > 0) {
                const latestVersion = data[0];
                if (latestVersion.version !== currentVersion) {
                    setVersionData(latestVersion);
                    setVisible(true);
                    return true; // Ada update yang tersedia
                }
            }
            return false; // Tidak ada update
        } catch (error) {
            console.error('Update check failed:', error);
            return false;
        }
    };

    const checkAdminPassword = async () => {
        try {
            const storedPassword = await AsyncStorage.getItem('userData')
            if (storedPassword) {
                navigation.replace('MainApp')
                return
            }
            const timer = setTimeout(() => {
                setShowModal(true)
            }, 1000)
            return () => clearTimeout(timer)

        } catch (error) {
            console.error('Error checking admin password:', error)
            setError('Terjadi kesalahan saat memeriksa password')
        }
    }

    const downloadDataLogin = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('data_login')
                .select('*')
                .eq('password', password);

            if (error) {
                setError('Password salah!');
                console.error('Error:', error.message);
                return false;
            }

            if (data && data.length > 0) {
                await AsyncStorage.setItem('userData', JSON.stringify(data[0]))
                return true;
            } else {
                setError('Password salah!');
                return false;
            }
        } catch (e) {
            console.error('Fetch error:', e);
            setError('Gagal mengambil data');
            return false;
        } finally {
            setLoading(false);
        }
    }

    const handleLogin = async () => {
        setError('')
        const isValid = await downloadDataLogin()
        if (isValid) {
            navigation.replace('MainApp')
        }
    }

    const handleUpdate = () => {
        const storeUrl = ios
            ? 'itms-beta://beta.itunes.apple.com/v1/app/com.kppmining.mokdev'
            : 'https://play.google.com/store/apps/details?id=com.easysabil';
        Linking.openURL(storeUrl);
        setVisible(!visible)
    };
    const handleClose = () => {
        setVisible(false);
    };

    useFocusEffect(
        React.useCallback(() => {
            checkForUpdates()
        }, [navigation, currentVersion])
    );
    return (
        <SafeAreaView style={styles.background}>
            <Image
                source={require('../../assets/splash.png')}
                style={{
                    width: windowWidth / 1.2,
                    height: windowHeight / 1.5
                }}
                resizeMode='contain'
            />

            <Modal
                statusBarTranslucent
                visible={showModal}
                transparent={true}
                animationType="fade"
            >
                <ScrollView
                    contentContainerStyle={styles.modalScrollContainer}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Masukkan Password Admin</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor="#666"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                    autoFocus
                                    autoCapitalize='none'
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.iconContainer}
                                >
                                    <Monicon name={showPassword ? "entypo:eye" : "entypo:eye-with-line"} size={25} color={"#666"} />
                                </TouchableOpacity>
                            </View>
                            {error ? <Text style={styles.errorText}>{error}</Text> : null}
                            <Button
                                mode="contained"
                                onPress={() => !loading ? handleLogin() : null}
                                style={styles.button}
                                textColor={COLOR_WHITE_1}
                                loading={loading}
                                // disabled={loading}
                                buttonColor={loading ? COLOR_TEXT_BODY : COLOR_PRIMARY}
                            >
                                Masuk
                            </Button>
                        </View>
                    </View>
                </ScrollView>
            </Modal>


            <Modal
                visible={visible}
                transparent={true}
                statusBarTranslucent
                animationType="fade"
                onRequestClose={handleClose}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalUpdateContainer}>
                        <View style={styles.modalHeader}>
                            <Monicon name="ic:outline-security-update-warning" size={30} color={COLOR_PRIMARY} />
                            <Text style={styles.modaUpdateTitle}>Update Available</Text>
                        </View>

                        <Text style={styles.modalText}>
                            {'A new version of the app is available. Please update to continue.'}
                        </Text>

                        <Text style={styles.versionText}>
                            Current Version: {currentVersion} → New Version: {versionData?.version}
                        </Text>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.buttonUpdate, styles.primaryButton]}
                                onPress={handleUpdate}
                            >
                                <Text style={styles.buttonText}>Update Now</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

export default SplashScreen

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLOR_PRIMARY
    },
    modalScrollContainer: {
        flexGrow: 1,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: '80%',
        alignItems: 'center',
        marginVertical: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#000',
    },
    inputContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        marginBottom: 15,
    },
    input: {
        flex: 1,
        height: 50,
        paddingHorizontal: 15,
        color: '#000',
    },
    iconContainer: {
        padding: 10,
    },
    button: {
        width: '100%',
        marginTop: 10,
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalUpdateContainer: {
        width: '100%',
        backgroundColor: COLOR_WHITE_1,
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    modaUpdateTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
        color: '#121212',
    },
    modalText: {
        fontSize: 16,
        marginBottom: 15,
        color: '#333',
        lineHeight: 22,
    },
    versionText: {
        fontSize: 14,
        marginBottom: 20,
        color: '#666',
        fontStyle: 'italic',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    buttonUpdate: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginLeft: 10,
        minWidth: 100,
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: COLOR_PRIMARY,
    },
    secondaryButton: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: COLOR_WHITE_1,
        fontWeight: 'bold',
    },
})