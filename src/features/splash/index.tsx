import { Image, Modal, SafeAreaView, StyleSheet, Text, TextInput, View, ScrollView, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { COLOR_PRIMARY, COLOR_TEXT_BODY, COLOR_WHITE_1 } from '../../utils/constant'
import { windowHeight, windowWidth } from '../../utils/helper'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Button } from 'react-native-paper'
import { supabase } from '../../config'
import Monicon from '@monicon/native'

const SplashScreen = ({ navigation }: any) => {
    const [showModal, setShowModal] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        checkAdminPassword()
    }, [])

    const checkAdminPassword = async () => {
        try {
            const storedPassword = await AsyncStorage.getItem('userData')
            if (storedPassword) {
                navigation.replace('MainApp')
                return
            }
            // If no password is stored, show the modal after 1 second
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
    }
})