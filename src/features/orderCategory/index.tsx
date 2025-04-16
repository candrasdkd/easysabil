import { Alert, FlatList, KeyboardAvoidingView, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Button, Card } from 'react-native-paper';
import Monicon from '@monicon/native';
import { COLOR_BG_CARD, COLOR_DELETE_1, COLOR_DISABLE_1, COLOR_PRIMARY, COLOR_TEXT_BODY, COLOR_WHITE_1, COLOR_WHITE_2 } from '../../utils/constant';
import { supabase } from '../../config';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { DataCategory, DataFamily, DataFolder, SelectedCategoryProps } from '../../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { formatRupiah, ios } from '../../utils/helper';
import BaseScreen from '../../components/BaseScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
    CreateCategoryOrder: { dataFamily: DataFamily[] | null };
    ListOrder: { selectedCategory: SelectedCategoryProps };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
const dummyData = Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    title: `Pesanan #00${i + 1}`,
    subtitle: ["Dikirim", "Diproses", "Selesai", "Dibatalkan", "Menunggu Pembayaran"][i % 5]
}));

const OrderCategoryScreen = () => {
    const today = new Date();
    const navigation = useNavigation<NavigationProp>();
    const [searchQuery, setSearchQuery] = useState('');
    const [dataFolder, setDataFolder] = useState<DataFolder[]>([]);
    const [filteredData, setFilteredData] = useState<DataFolder[]>([]);
    const [detailData, setDetailData] = useState<{ id: number }>({ id: 0 })
    const [modalVisible, setModalVisible] = useState(false);
    const [modalUpdate, setModalUpdate] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [userLevel, setUserLevel] = useState<number | null>(null);
    const [bodyUser, setBodyUser] = useState({
        category: '',
        year: today.getFullYear(),
        formatRupiah: '0'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchListOrder = async () => {
        try {
            setLoading(!loading);
            const { data, error } = await supabase
                .from('category_order')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) {
                console.error('Error:', error.message);
                return;
            }
            const formattedData = data.map(item => ({
                ...item,
                formatRupiah: formatRupiah(item.price.toString()),
            }));
            setDataFolder(formattedData);
            setFilteredData(formattedData);
        } catch (e) {
            console.error('Fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitOrder = async () => {
        try {
            if (!bodyUser.category || !bodyUser.formatRupiah) {
                Alert.alert('INFO', 'Semua field harus diisi.');
                return; // Exit the function if validation fails
            }
            setUploading(true);

            const numericPrice = parseInt(bodyUser.formatRupiah.replace(/[^0-9]/g, ''), 10) || 0; // Convert to number

            if (isNaN(numericPrice)) {
                Alert.alert('Error', 'Harga harus berupa angka yang valid.');
                return;
            }

            const transformBody = {
                name: bodyUser.category,
                year: today.getFullYear(),
                price: numericPrice,
            };
            const { error, status } = await supabase
                .from('category_order')
                .insert([transformBody])
                .select();

            if (status === 201) {
                Alert.alert('Berhasil', 'Data berhasil dibuat');
                fetchListOrder();
            } else {
                Alert.alert('Error', error?.message || 'Terjadi kesalahan saat menyimpan data.');
            }
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setUploading(false);
            handleClearClose();
        }
    };

    const handleUpdateOrder = async () => {
        try {
            setUploading(true);

            if (!bodyUser.formatRupiah || bodyUser.formatRupiah === 'Rp') {
                Alert.alert('INFO', 'Semua field harus diisi.');
                return; // Exit the function if validation fails
            }

            const numericPrice = parseInt(bodyUser.formatRupiah.replace(/[^0-9]/g, ''), 10) || 0; // Convert to number

            if (isNaN(numericPrice)) {
                Alert.alert('Error', 'Harga harus berupa angka yang valid.');
                return;
            }

            const transformBody = {
                name: bodyUser.category,
                year: bodyUser.year,
                price: numericPrice,
            };

            const { error, status } = await supabase
                .from('category_order')
                .update(transformBody)
                .eq('id', detailData.id)
                .select();

            if (status === 200) {
                Alert.alert('Berhasil', 'Data berhasil dibuat');
                fetchListOrder();
                setDetailData({
                    id: 0,
                })
            } else {
                Alert.alert('Error', error?.message || 'Terjadi kesalahan saat menyimpan data.');
            }
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setUploading(false);
            handleClearClose();
        }
    };

    const handleDeleteCategory = async (id: number) => {
        Alert.alert(
            "Konfirmasi Hapus",
            "Apakah Anda yakin ingin menghapus data ini?",
            [
                {
                    text: "Batal",
                    onPress: () => console.log("Hapus dibatalkan"),
                    style: "cancel"
                },
                {
                    text: "Hapus",
                    onPress: async () => {
                        const { error, status } = await supabase
                            .from('category_order')
                            .delete()
                            .eq('id', id);

                        if (error) {
                            setError(error.message);
                            console.error('Error:', error.message);
                            return;
                        }

                        if (status === 204) {
                            setSearchQuery('');
                            Alert.alert('Berhasil', 'Data berhasil dihapus');
                            fetchListOrder();
                        }
                    }
                }
            ],
            { cancelable: false }
        );
    }

    const handlePriceChange = (text: string) => {
        setBodyUser({ ...bodyUser, formatRupiah: text });
    };

    const handleClearClose = () => {
        setBodyUser({
            category: '',
            year: bodyUser.year,
            formatRupiah: ''
        });
        setModalUpdate(false);
        setModalVisible(false);
    };

    useEffect(() => {
        checkUserLevel();
    }, []);

    const checkUserLevel = async () => {
        try {
            const userDataString = await AsyncStorage.getItem('userData');
            if (userDataString) {
                const userData = JSON.parse(userDataString);
                setUserLevel(userData.level);
            }
        } catch (error) {
            console.error('Error checking user level:', error);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
          // if (props.route.params?.refresh) {
            fetchListOrder();
            checkUserLevel();
          // }
        }, [navigation])
      );
    // Filter data based on searchQuery
    useEffect(() => {
        if (!searchQuery) {
            setFilteredData(dataFolder);
        } else {
            const lowerCaseQuery = searchQuery.toLowerCase();
            const filtered = dataFolder.filter(item =>
                item.name.toLowerCase().includes(lowerCaseQuery)
            );
            setFilteredData(filtered);
        }
    }, [searchQuery, dataFolder]);

    return (
        <BaseScreen>
            {/* Search Input */}
            <View style={{ height: 40, marginVertical: 15, marginHorizontal: 20 }}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Cari nama kategori..."
                    placeholderTextColor={COLOR_TEXT_BODY}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* List Data */}
            {loading ?
                <FlatList
                    data={dummyData}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ paddingHorizontal: 20 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={{ marginBottom: 10 }}>
                            <Card.Title
                                title={`Downloading...`}
                                subtitle={'Downloading...'}
                                left={() => <Monicon name="material-symbols:folder-open-rounded" size={30} color={COLOR_PRIMARY} />}
                                style={{
                                    backgroundColor: COLOR_BG_CARD,
                                    shadowColor: COLOR_WHITE_2,
                                    borderRadius: 20,
                                    paddingRight: 15,
                                    borderBottomWidth: 1,
                                    borderColor: COLOR_WHITE_1

                                }}
                                titleStyle={{ color: COLOR_WHITE_1 }}
                                subtitleStyle={{ color: COLOR_WHITE_1 }}
                                right={() => <Monicon name="material-symbols:chevron-right-rounded" size={30} color={COLOR_WHITE_1} />}
                            />
                        </TouchableOpacity>
                    )}
                /> :
                <FlatList
                    data={filteredData || []}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ paddingHorizontal: 20 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={{ marginBottom: 10 }}
                            onPress={() => navigation.navigate('ListOrder', {
                                selectedCategory: {
                                    label: `${item.name} ${item.year}`,
                                    value: `${item.name} ${item.year}`,
                                    id: item.id.toString(),
                                    name: item.name,
                                    price: item.price.toString()
                                }
                            })}>
                            <Card.Title
                                title={`${item.name} (${item.year})`}
                                subtitle={`${item.formatRupiah}`}
                                left={() => <Monicon name="material-symbols:folder-open-rounded" size={25} color={COLOR_PRIMARY} />}
                                style={{
                                    backgroundColor: COLOR_BG_CARD,
                                    shadowColor: COLOR_WHITE_1,
                                    borderRadius: 10,
                                    paddingRight: 15,
                                    borderBottomWidth: 1,
                                    borderColor: COLOR_WHITE_1
                                }}
                                titleStyle={{ color: COLOR_WHITE_1 }}
                                subtitleStyle={{ color: COLOR_WHITE_1 }}
                                right={() =>
                                    <>
                                        {userLevel === 0 && (
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setModalUpdate(!modalUpdate)
                                                        setDetailData({ id: item.id })
                                                        setBodyUser({
                                                            ...bodyUser,
                                                            category: item.name,
                                                            formatRupiah: item.formatRupiah || '0',
                                                            year: item.year
                                                        })
                                                    }}
                                                >
                                                    <Monicon
                                                        name="material-symbols:edit-square-outline"
                                                        size={20}
                                                        color={COLOR_TEXT_BODY}
                                                    />
                                                </TouchableOpacity>
                                                <View style={{ width: 5 }} />
                                                <TouchableOpacity onPress={() => handleDeleteCategory(item.id)}>
                                                    <Monicon
                                                        name="material-symbols:delete-outline-sharp"
                                                        size={20}
                                                        color={COLOR_DELETE_1}
                                                    />
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </>
                                }
                            />
                        </TouchableOpacity>
                    )}
                    refreshing={loading}
                    onRefresh={fetchListOrder}
                    ListEmptyComponent={<Text style={{ color: COLOR_WHITE_1, textAlign: 'center' }}>
                        Tidak ada data
                    </Text>}
                />
            }


            {/* Modal for Adding Category Order */}
            <Modal
                animationType="fade"
                statusBarTranslucent
                transparent={true}
                visible={modalVisible || modalUpdate}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <KeyboardAvoidingView
                        behavior={ios ? 'padding' : 'height'} // Untuk iOS, gunakan padding
                        style={{ flex: 1, width: '100%' }}
                    >
                        <ScrollView
                            contentContainerStyle={styles.modalContentContainer}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>{modalUpdate ? 'Update Data' : 'Tambah Data'}</Text>

                                <Text style={{ color: COLOR_WHITE_1 }}>Kategori</Text>
                                <TextInput
                                    editable={!uploading}
                                    value={bodyUser.category}
                                    style={[styles.dropdown, { color: COLOR_WHITE_1 }]}
                                    placeholder="Masukkan nama kategori"
                                    placeholderTextColor={COLOR_WHITE_1}
                                    onChangeText={(e) => setBodyUser({ ...bodyUser, category: e })}
                                />

                                <Text style={{ color: COLOR_WHITE_1 }}>Harga (pcs)</Text>
                                <TextInput
                                    editable={!uploading}
                                    value={bodyUser.formatRupiah ? formatRupiah(bodyUser.formatRupiah) : bodyUser.formatRupiah}
                                    style={[styles.dropdown, { color: COLOR_WHITE_1 }]}
                                    placeholder="Masukkan harga satuan"
                                    placeholderTextColor={COLOR_WHITE_1}
                                    keyboardType="number-pad"
                                    onChangeText={handlePriceChange}
                                />

                                <Text style={{ color: COLOR_WHITE_1 }}>Tahun</Text>
                                <TextInput
                                    editable={false}
                                    value={today.getFullYear().toString()}
                                    style={[styles.dropdown, { color: COLOR_TEXT_BODY, backgroundColor: COLOR_DISABLE_1 }]}
                                />

                                <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 20 }}>
                                    <Button
                                        loading={uploading}
                                        mode="outlined"
                                        style={{ flex: 0.45, borderColor: uploading ? COLOR_TEXT_BODY : COLOR_PRIMARY }}
                                        textColor={uploading ? COLOR_TEXT_BODY : COLOR_PRIMARY}
                                        onPress={handleClearClose}
                                    >
                                        <Text>Tutup</Text>
                                    </Button>
                                    <Button
                                        loading={uploading}
                                        mode="contained"
                                        style={{ flex: 0.45 }}
                                        textColor={COLOR_WHITE_1}
                                        buttonColor={uploading ? COLOR_TEXT_BODY : COLOR_PRIMARY}
                                        onPress={modalUpdate ? handleUpdateOrder : handleSubmitOrder}
                                    >
                                        <Text>Submit</Text>
                                    </Button>
                                </View>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* Add Button */}
            <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(!modalVisible)}>
                <Monicon name="material-symbols:add" size={30} color={COLOR_WHITE_1} />
            </TouchableOpacity>
        </BaseScreen >
    );
}

export default OrderCategoryScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLOR_BG_CARD,
        paddingTop: 15,
    },
    searchInput: {
        height: 40,
        borderColor: COLOR_WHITE_1,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 10,
        color: COLOR_WHITE_1,
        flex: 1
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginTop: 20,
    },
    emptyText: {
        color: COLOR_WHITE_1,
        textAlign: 'center',
        marginTop: 20,
    },
    addButton: {
        position: 'absolute',
        bottom: 25,
        right: 25,
        width: 50,
        height: 50,
        borderRadius: 50,
        backgroundColor: COLOR_PRIMARY,
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContentContainer: {
        flexGrow: 1, // Agar bisa di-scroll dengan baik
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20, // Memberikan ruang agar lebih nyaman di-scroll
    },
    modalContent: {
        width: '85%',
        backgroundColor: COLOR_BG_CARD,
        borderRadius: 10,
        padding: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: COLOR_WHITE_1
    },
    dropdown: {
        height: 40,
        borderColor: COLOR_WHITE_1,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
        marginTop: 5,
        marginBottom: 15,
        backgroundColor: COLOR_BG_CARD,
    },
});