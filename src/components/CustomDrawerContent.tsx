import React from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItem, DrawerItemList } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Monicon from '@monicon/native';
import { COLOR_WHITE_1 } from '../utils/constant';

const CustomDrawerContent = (props: any) => {
    const handleLogout = async () => {
        Alert.alert(
            "Konfirmasi Logout",
            "Apakah Anda yakin ingin keluar dari aplikasi?",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Logout",
                    onPress: async () => {
                        try {
                            // Hapus semua data dari AsyncStorage
                            await AsyncStorage.clear();
                            console.log("AsyncStorage Cleared");

                            // Reset navigasi ke layar Splash
                            props.navigation.reset({
                                index: 0,
                                routes: [{ name: "Splash" }],
                            });
                        } catch (error) {
                            console.error("Error clearing AsyncStorage:", error);
                        }
                    },
                    style: "destructive",
                }
            ]
        );
    };

    return (
        <View style={{ flex: 1 }}>
            <DrawerContentScrollView {...props}>
                <DrawerItemList {...props} />
            </DrawerContentScrollView>
            <View style={styles.logoutContainer}>
                <DrawerItem
                    label="Logout"
                    icon={({ color, size }) => (
                        <Monicon name="mdi:logout" size={25} color={COLOR_WHITE_1} />
                    )}
                    onPress={handleLogout}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    logoutContainer: {
        borderTopWidth: 1,
        borderTopColor: '#444',
        paddingVertical: 10,
    },
});

export default CustomDrawerContent;
