import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, ActivityIndicator, Text, View, TextInput, Modal, TouchableOpacity, Alert, Pressable, KeyboardAvoidingView, Linking, Platform } from 'react-native';
import { Button, DataTable, Switch } from 'react-native-paper';
import { COLOR_BG_CARD, COLOR_DELETE_1, COLOR_PRIMARY, COLOR_TEXT_BODY, COLOR_WHITE_1, COLOR_WHITE_2 } from '../../utils/constant';
import { DataDropdown, DataOrder, SelectedCategoryProps } from '../../types/';
import { supabase } from '../../config';
import { Monicon } from "@monicon/native";
import { Dropdown } from 'react-native-element-dropdown';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { formatRupiah, ios } from '../../utils/helper';
import BaseScreen from '../../components/BaseScreen';
import * as Clipboard from '@react-native-clipboard/clipboard';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type ListOrderRouteParams = {
    selectedCategory: SelectedCategoryProps; // Adjust this type based on your actual DataFamily type
};

const ListOrderScreen = () => {
    const route = useRoute<RouteProp<{ params: ListOrderRouteParams }>>();
    const navigation = useNavigation()
    const [dataOrder, setDataOrder] = useState<DataOrder[]>([]);
    const [dataDropdownSensus, setDataDropdownSensus] = useState<DataDropdown[]>([]);
    const [dataDropdownCategory, setDataDropdownCategory] = useState<DataDropdown[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(15);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [modalCreate, setModalCreate] = useState(false);
    const [modalFilter, setModalFilter] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showAllData, setShowAllData] = useState(false);
    const [modalUpdate, setModalUpdate] = useState(false);
    const [hidePrice, setHidePrice] = useState(false);
    const [settingFilter, setSettingFilter] = useState<{
        category: SelectedCategoryProps;
        isPayment: boolean | null;
    }>({
        category: {
            label: '',
            value: '',
            id: '',
            name: '',
            price: ''
        },
        isPayment: null
    });
    const [dataUpload, setDataUpload] = useState({
        idCard: null as number | null,
        user: { label: '', value: '', id: '' },
        category: route?.params?.selectedCategory || { label: '', value: '', id: '', name: '', price: '' },
        totalOrder: '',
        note: ''
    })
    const [actualPrice, setActualPrice] = useState('');
    const [isExactChange, setIsExactChange] = useState(false);
    const [detailData, setDetailData] = useState({
        id: 0,
        price: '',
        status: false
    });
    // ref
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['25%', '50%', '70%'], []);

    // callbacks
    const handleSheetChanges = useCallback((index: number) => {
        console.log('handleSheetChanges', index);
    }, []);
    const onToggleSwitch = () => setIsExactChange(!isExactChange);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
            />
        ),
        []
    );

    const handlePresentModalPress = useCallback(() => {
        bottomSheetRef.current?.expand();
    }, []);

    // Calculate grandTotal
    const grandTotal = useMemo(() => {
        return dataOrder.reduce((total, item) => {
            return total + (item.unit_price * item.total_order);
        }, 0);
    }, [dataOrder]);

    const grandTotalActual = useMemo(() => {
        return dataOrder.reduce((total, item) => {
            return total + (item.actual_price);
        }, 0);
    }, [dataOrder]);

    const fetchDataOrder = async () => {
        let response
        try {
            setLoading(true)
            if (settingFilter.category.id && !showAllData) {
                response = await supabase
                    .from('data_order')
                    .select('*')
                    .eq('id_category_order', settingFilter.category.id)
                    .order('created_at', { ascending: false });
            } else {
                response = await supabase
                    .from('data_order')
                    .select('*')
                    .order('created_at', { ascending: false });
            }

            const { data, error } = response;

            if (response) {
                if (error) {
                    setError(error.message);
                    console.error('Error:', error.message);
                    return;
                }
                setDataOrder(data);
            }

        } catch (e) {
            console.error('Fetch error:', e);
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const fetchSensus = async () => {
        // handleClear();
        try {
            const { data, error } = await supabase
                .from('sensus')
                .select('uuid,name')
                .order('name', { ascending: true });
            if (error) {
                setError(error.message);
                console.error('Error:', error.message);
                return;
            }
            const transformedData = data.map(item => ({
                label: item.name,
                value: item.name,
                id: item.uuid
            }));
            setDataDropdownSensus(transformedData);
        } catch (e) {
            console.error('Fetch error:', e);
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const fetchListOrder = async () => {
        try {
            setLoading(false);
            const { data, error } = await supabase
                .from('category_order')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) {
                console.error('Error:', error.message);
                return;
            }
            const transformedData = data.map(item => ({
                ...item,
                label: `${item.name} ${item.year}`,
                value: `${item.name} ${item.year}`,
                id: item.id,
            }));
            setDataDropdownCategory(transformedData)
        } catch (e) {
            console.error('Fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateOrder = async () => {
        try {
            setUploading(true);
            const selectionPrice = actualPrice;
            const numericPrice = parseInt(selectionPrice.replace(/[^0-9]/g, ''), 10) || 0; // Convert to number
            if (!isExactChange && numericPrice === 0 || !isExactChange && numericPrice === null) {
                Alert.alert('Info', 'Masukkan uang yang diterima');
                return;
            }
            const transformBody = {
                actual_price: numericPrice,
                is_payment: !detailData?.status,
            };

            const { error, status } = await supabase
                .from('data_order')
                .update(transformBody)
                .eq('id', detailData?.id)
                .select();

            if (status === 200) {
                Alert.alert('Berhasil', 'Data berhasil dibuat');
                fetchDataOrder();
                handleResetPayment()
            } else {
                Alert.alert('Error', error?.message || 'Terjadi kesalahan saat menyimpan data.');
            }
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setUploading(false);
        }
    };

    const handleCreateOrder = async () => {
        try {
            console.log(dataUpload);
            if (!dataUpload?.user?.value || !dataUpload?.user?.id ||
                !dataUpload?.category?.id || !dataUpload?.category?.name ||
                !dataUpload?.totalOrder) {
                Alert.alert('Info', 'Semua field harus diisi');
                return;
            }

            const transformBody = {
                user_name: dataUpload?.user.value,
                user_id: dataUpload.user?.id,
                id_category_order: parseInt(dataUpload?.category.id),
                name_category: dataUpload?.category.label,
                total_order: parseInt(dataUpload.totalOrder),
                unit_price: parseInt(dataUpload?.category.price),
                note: dataUpload?.note
            };

            setUploading(true);
            if (modalUpdate) {
                const { error, status } = await supabase
                    .from('data_order')
                    .update(transformBody)
                    .eq('id', dataUpload.idCard)
                    .select();

                if (status === 200) {
                    Alert.alert('Berhasil', 'Data berhasil diupdate');
                    fetchDataOrder();
                } else {
                    Alert.alert('Error', error?.message || 'Terjadi kesalahan saat menyimpan data.');
                }
            } else {
                const { error, status } = await supabase
                    .from('data_order')
                    .insert([transformBody])
                    .select();
                if (status === 201) {
                    Alert.alert('Berhasil', 'Data berhasil dibuat');
                    fetchDataOrder();
                } else {
                    Alert.alert('Error', error?.message || 'Terjadi kesalahan saat menyimpan data.');
                }
            }
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setUploading(false);
            handleResetUpload();
        }
    };

    const handleDeleteUser = async (id: number) => {
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
                            .from('data_order')
                            .delete()
                            .eq('id', id);

                        if (error) {
                            setError(error.message);
                            console.error('Error:', error.message);
                            return;
                        }

                        if (status === 204) {
                            handleClear();
                            Alert.alert('Berhasil', 'Data berhasil dihapus');
                            fetchDataOrder(); // Refresh the data
                        }
                    }
                }
            ],
            { cancelable: false }
        );
    }

    const handleClear = () => {
        setSearchQuery('');
        setSettingFilter({
            category: { label: '', value: '', id: '', name: '', price: '' },
            isPayment: null
        });
    }

    const handleResetPayment = () => {
        setDetailData({
            id: 0,
            price: '',
            status: false
        });
        setActualPrice('');
        setIsExactChange(false);
        setModalVisible(!modalVisible)
    }

    const handleResetUpload = () => {
        setDataUpload({
            idCard: null,
            user: { label: '', value: '', id: '' },
            category: { label: '', value: '', id: '', name: '', price: '' },
            totalOrder: '',
            note: ''
        });
        setIsExactChange(false);
        setModalUpdate(false);
        setModalCreate(false);
    }

    useFocusEffect(
        React.useCallback(() => {
            // if (props.route.params?.refresh) {
            if (settingFilter.category.id || showAllData) {
                fetchDataOrder();
            }
            // }
        }, [navigation, settingFilter.category.id, showAllData,])
    );

    useEffect(() => {
        fetchSensus();
        fetchListOrder()
    }, [])

    useEffect(() => {
        if (route.params?.selectedCategory) {
            setSettingFilter(prev => ({
                ...prev,
                category: route.params.selectedCategory
            }));
        }
    }, [route.params?.selectedCategory]);

    const filteredOrder = dataOrder.filter(item => {
        const matchesSearch = item.user_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = item.name_category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPayment = settingFilter.isPayment === null || item.is_payment === settingFilter.isPayment;
        return matchesSearch && matchesCategory && matchesPayment;
    });

    const totalPages = Math.ceil(filteredOrder.length / itemsPerPage);
    const from = page * itemsPerPage;
    const to = Math.min((page + 1) * itemsPerPage, filteredOrder.length);

    const totalPrice = (price: number, total: number) => {
        const calculated = price * total
        return calculated.toString();
    }

    const handleCopyToClipboard = () => {
        let grandTotal = 0;
        const formattedData = filteredOrder.map((item, index) => {
            const totalPrice = item.unit_price * item.total_order;
            grandTotal += totalPrice;
            return `${index + 1}. Nama: ${item.user_name}\n   📦 Jumlah: ${item.total_order} pcs\n ${hidePrice ? '' : ` 💰 Total: ${formatRupiah(totalPrice.toString())}\n`}  📝 Catatan: ${item.note || '-'}\n`;
        }).join('\n');

        const finalText = `*DAFTAR PESANAN ${settingFilter.category.label.toUpperCase()}*\n====================\n\n${formattedData}\n====================\n*TOTAL KESELURUHAN: ${formatRupiah(grandTotal.toString())}*`;
        Clipboard.default.setString(finalText);

        Alert.alert(
            'Berhasil',
            'Data berhasil disalin ke clipboard',
            [
                {
                    text: 'Pergi Ke Whatsapp',
                    onPress: () => {
                        // Encode the text for URL
                        const encodedText = encodeURIComponent(finalText);

                        // Check if WhatsApp is installed
                        const whatsappUrl = Platform.select({
                            ios: `https://wa.me/6285175070782?text=${encodedText}`,
                            android: `whatsapp://send?text=${encodedText}`,
                        });

                        if (whatsappUrl) {
                            Linking.canOpenURL(whatsappUrl)
                                .then(supported => {
                                    if (supported) {
                                        return Linking.openURL(whatsappUrl);
                                    } else {
                                        Alert.alert(
                                            'Error',
                                            'WhatsApp tidak terinstall di perangkat Anda',
                                            [
                                                {
                                                    text: 'Instal Whatsapp',
                                                    onPress: () => {
                                                        // Open Play Store/App Store if WhatsApp is not installed
                                                        const storeUrl = Platform.select({
                                                            ios: 'https://apps.apple.com/app/whatsapp-messenger/id310633997',
                                                            android: 'https://play.google.com/store/apps/details?id=com.whatsapp',
                                                        });
                                                        if (storeUrl) {
                                                            Linking.openURL(storeUrl);
                                                        }
                                                    }
                                                }
                                            ]
                                        );
                                    }
                                })
                                .catch(err => {
                                    console.error('Error opening WhatsApp:', err);
                                    Alert.alert('Error', 'Gagal membuka WhatsApp');
                                });
                        }
                    }
                }
            ]
        );
    };

    const renderContent = () => {
        if (loading) {
            return (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={COLOR_PRIMARY} />
                </View>
            );
        }
        if (error) {
            return (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            );
        }

        return (
            <>
                {!filteredOrder || filteredOrder.length === 0 ?
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={styles.emptyText}>No data available.</Text>
                    </View> :
                    <>
                        <ScrollView horizontal nestedScrollEnabled>
                            <DataTable>
                                <DataTable.Header>
                                    <DataTable.Title textStyle={[styles.textHeader, { width: 80, alignSelf: 'center' }]}>STATUS</DataTable.Title>
                                    <DataTable.Title textStyle={[styles.firstColumn, styles.textHeader]}>NAMA</DataTable.Title>
                                    <DataTable.Title textStyle={[styles.firstColumn, styles.textHeader]}>KATEGORI</DataTable.Title>
                                    <DataTable.Title textStyle={[styles.textHeader, { width: 80 }]}>JUMLAH</DataTable.Title>
                                    {!hidePrice &&
                                        <>
                                            <DataTable.Title textStyle={[styles.textHeader, { width: 100 }]}>
                                                <View style={{ justifyContent: 'center', width: '100%' }}>
                                                    <Text style={styles.textHeader}>HARGA</Text>
                                                    <Text style={styles.textHeader}>SATUAN</Text>
                                                </View>
                                            </DataTable.Title>
                                            <DataTable.Title textStyle={[styles.textHeader, { width: 100 }]}>
                                                <View style={{ justifyContent: 'center', width: '100%' }}>
                                                    <Text style={styles.textHeader}>TOTAL</Text>
                                                    <Text style={styles.textHeader}>HARGA</Text>
                                                </View>
                                            </DataTable.Title>
                                            <DataTable.Title textStyle={[styles.textHeader, { width: 100 }]}>
                                                <View style={{ justifyContent: 'center', width: '100%' }}>
                                                    <Text style={styles.textHeader}>UANG</Text>
                                                    <Text style={styles.textHeader}>YG DITERIMA</Text>
                                                </View>
                                            </DataTable.Title>
                                        </>
                                    }
                                    <DataTable.Title textStyle={[styles.textHeader, { width: 80 }]}>CATATAN</DataTable.Title>
                                    <DataTable.Title textStyle={[styles.textHeader, { width: 120 }]}>ACTION</DataTable.Title>
                                </DataTable.Header>
                                <ScrollView>
                                    {filteredOrder.slice(from, to).map((item) => (
                                        <DataTable.Row key={item.id}>
                                            <DataTable.Cell textStyle={[styles.textTable, { width: 80, alignItems: "center" }]}>
                                                <View style={{ width: 80 }}>
                                                    <TouchableOpacity
                                                        style={{ justifyContent: 'center', alignItems: 'center' }}
                                                        // onPress={() => handleUpdateOrder(item.id, item.is_payment)}
                                                        onPress={() => {
                                                            if (item.is_payment) {
                                                                Alert.alert('Info', 'Pembayaran sudah lunas')
                                                            } else {
                                                                setDetailData({
                                                                    id: item.id,
                                                                    price: formatRupiah(totalPrice(item.unit_price, item.total_order)),
                                                                    status: item.is_payment
                                                                })
                                                                setModalVisible(!modalVisible)
                                                            }

                                                        }}
                                                    >
                                                        {item.is_payment ?
                                                            <Monicon name="material-symbols:check-box-rounded" size={25} color={'green'} /> :
                                                            <Monicon name="material-symbols:check-box-outline-blank" size={25} color={'red'} />
                                                        }
                                                    </TouchableOpacity>
                                                </View>
                                            </DataTable.Cell>
                                            <DataTable.Cell textStyle={[styles.firstColumn, { paddingLeft: 15 }]}>{item.user_name}</DataTable.Cell>
                                            <DataTable.Cell textStyle={[styles.firstColumn, { textAlign: 'center' }]}>{item.name_category}</DataTable.Cell>
                                            <DataTable.Cell textStyle={[styles.textTable, { width: 80 }]}>{item.total_order} pcs</DataTable.Cell>
                                            {!hidePrice &&
                                                <>
                                                    <DataTable.Cell textStyle={[styles.textTable, { width: 100 }]}>{formatRupiah(item.unit_price.toString())}</DataTable.Cell>
                                                    <DataTable.Cell textStyle={[styles.textTable, { width: 100 }]}>{formatRupiah(totalPrice(item.unit_price, item.total_order))}</DataTable.Cell>
                                                    <DataTable.Cell textStyle={[styles.textTable, { width: 100 }]}>{formatRupiah(item.actual_price.toString())}</DataTable.Cell>
                                                </>
                                            }
                                            <DataTable.Cell textStyle={[styles.textTable, { width: 80 }]}>{item.note}</DataTable.Cell>
                                            <DataTable.Cell textStyle={[styles.textTable, { width: 120 }]}>
                                                <View style={{ flexDirection: 'row', width: 120, justifyContent: 'center' }}>
                                                    <TouchableOpacity
                                                        style={styles.filterButton}
                                                        onPress={() => {
                                                            setDataUpload(
                                                                {
                                                                    idCard: item.id,
                                                                    user: {
                                                                        label: item.user_name,
                                                                        value: item.user_name,
                                                                        id: item.user_id,
                                                                    },
                                                                    category: {
                                                                        label: item.name_category,
                                                                        value: item.name_category,
                                                                        id: item.id_category_order.toString(),
                                                                        name: item.name_category,
                                                                        price: item.unit_price.toString()
                                                                    },
                                                                    totalOrder: item.total_order.toString(),
                                                                    note: item.note
                                                                }
                                                            )
                                                            setModalUpdate(true)
                                                        }}
                                                    >
                                                        <Monicon name="material-symbols:edit-square-outline" size={25} color={COLOR_WHITE_1} />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[styles.filterButton, { backgroundColor: COLOR_DELETE_1, marginLeft: 5 }]}
                                                        onPress={() => handleDeleteUser(item.id)}
                                                    >
                                                        <Monicon name="material-symbols:delete-outline-sharp" size={25} color={COLOR_WHITE_1} />
                                                    </TouchableOpacity>
                                                </View>
                                            </DataTable.Cell>
                                        </DataTable.Row>
                                    ))}
                                </ScrollView>
                            </DataTable>
                        </ScrollView>
                        <View style={styles.paginationContainer}>
                            <Text style={styles.paginationText}>
                                Page {page + 1} of {Math.ceil(filteredOrder.length / itemsPerPage)} (total {filteredOrder.length} data)
                            </Text>
                            <View style={styles.paginationButtons}>
                                <Button
                                    disabled={page === 0}
                                    onPress={() => page === 0 ? null : setPage(page - 1)}
                                    textColor={COLOR_PRIMARY}
                                >
                                    Previous
                                </Button>
                                <Button
                                    disabled={page + 1 >= totalPages}
                                    onPress={() => page + 1 >= totalPages ? null : setPage(page + 1)}
                                    textColor={COLOR_PRIMARY}
                                >
                                    Next
                                </Button>
                            </View>
                        </View>
                        <Button
                            // disabled={uploading}
                            mode='contained'
                            style={{ backgroundColor: COLOR_PRIMARY, marginHorizontal: 20, marginBottom: ios ? 0 : 20 }}
                            textColor={COLOR_WHITE_1}
                            onPress={handlePresentModalPress}>
                            <Text>Tampilkan Perhitungan</Text>
                        </Button>
                    </>
                }
            </>
        )
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <BaseScreen>
                {settingFilter.category.id || showAllData ?
                    <>
                        <View style={styles.searchContainer}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Cari nama..."
                                placeholderTextColor={COLOR_TEXT_BODY}
                                value={searchQuery}
                                onChangeText={(e) => {
                                    setPage(0)
                                    setSearchQuery(e)
                                }}
                            />

                            <TouchableOpacity style={styles.filterButton} onPress={() => setModalFilter(true)} >
                                <Monicon name="material-symbols:filter-alt" size={30} color={COLOR_WHITE_1} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.fab} onPress={handleCopyToClipboard}>
                                <Monicon name="material-symbols:content-copy" size={30} color={COLOR_WHITE_1} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.filterButton} onPress={() => setModalCreate(true)}>
                                <Monicon name="material-symbols:add" size={30} color={COLOR_WHITE_1} />
                            </TouchableOpacity>
                        </View>
                        {renderContent()}

                    </>

                    :
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Dropdown
                            disable={uploading}
                            style={[styles.dropdown, { marginHorizontal: 30 }]}
                            placeholderStyle={styles.placeholderStyle}
                            selectedTextStyle={styles.selectedTextStyle}
                            inputSearchStyle={styles.inputSearchStyle}
                            containerStyle={{ backgroundColor: COLOR_BG_CARD }}
                            itemTextStyle={{ color: COLOR_WHITE_1, fontSize: 13 }}
                            activeColor={COLOR_PRIMARY}
                            data={dataDropdownCategory || []}
                            search
                            maxHeight={300}
                            labelField="label"
                            valueField="value"
                            placeholder={'Pilih kategori data yang ingin ditampilkan'}
                            searchPlaceholder="Search..."
                            value={settingFilter.category?.label}
                            onFocus={fetchListOrder}
                            onChange={item => {
                                setSettingFilter({
                                    ...settingFilter,
                                    category: {
                                        ...item,
                                        label: `${item.name} ${item.year}`,
                                        value: `${item.name} ${item.year}`,
                                        price: `${item.price}`
                                    }
                                });
                            }}
                        />
                    </View>
                }

                {/* MODAL PAYMENT*/}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <Text style={styles.modalTitle}>STATUS PEMBAYARAN</Text>
                            </View>
                            <View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                    <Text style={{ color: COLOR_WHITE_1, marginRight: 10 }}>Pembayaran Pas</Text>
                                    <Switch
                                        color={COLOR_PRIMARY}
                                        value={isExactChange}
                                        onValueChange={onToggleSwitch}
                                    />
                                </View>
                                <Text style={{ color: COLOR_WHITE_1, marginRight: 10 }}>Total Yang Harus Dibayarkan</Text>
                                <TextInput
                                    editable={false}
                                    defaultValue={detailData.price}
                                    style={[styles.dropdown, { color: COLOR_WHITE_1, backgroundColor: 'gray' }]}
                                    placeholder='Masukkan nama kategori'
                                    placeholderTextColor={COLOR_WHITE_1}
                                />

                                <Text style={{ color: COLOR_WHITE_1, marginRight: 10 }}>Total Uang Yang Diterima</Text>
                                <TextInput
                                    editable={!isExactChange}
                                    defaultValue={isExactChange ? detailData.price : actualPrice ? formatRupiah(actualPrice) : actualPrice}
                                    style={[styles.dropdown, { color: COLOR_WHITE_1, backgroundColor: isExactChange ? 'gray' : COLOR_BG_CARD }]}
                                    placeholder='Masukkan uang yang diterima'
                                    placeholderTextColor={COLOR_WHITE_1}
                                    keyboardType='number-pad'
                                    onChangeText={(e) => setActualPrice(e)}
                                />
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 }}>
                                <Button
                                    onPress={handleResetPayment}
                                    textColor={COLOR_PRIMARY}>
                                    Tutup
                                </Button>
                                <Button
                                    mode='contained'
                                    buttonColor={COLOR_PRIMARY}
                                    onPress={handleUpdateOrder}
                                    textColor={COLOR_WHITE_1}>
                                    Update
                                </Button>
                            </View>

                        </View>
                    </View>
                </Modal>
                {/* MODAL CREATE*/}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={modalCreate || modalUpdate}
                    onRequestClose={() => {
                        if (modalUpdate) {
                            setDataUpload({
                                idCard: null,
                                user: { label: '', value: '', id: '' },
                                category: { label: '', value: '', id: '', name: '', price: '' },
                                totalOrder: '',
                                note: ''
                            });
                            setModalUpdate(false)
                        } else {
                            setModalCreate(false)
                        }

                    }}
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
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                        <Text style={styles.modalTitle}>{modalUpdate ? 'UPDATE DATA' : 'TAMBAH DATA'}</Text>
                                    </View>
                                    <View>
                                        <Text style={{ color: COLOR_WHITE_1 }}>Pilih Nama yang Memesan</Text>
                                        <Dropdown
                                            disable={uploading}
                                            style={[styles.dropdown]}
                                            placeholderStyle={styles.placeholderStyle}
                                            selectedTextStyle={styles.selectedTextStyle}
                                            inputSearchStyle={styles.inputSearchStyle}
                                            containerStyle={{ backgroundColor: COLOR_BG_CARD }}
                                            itemTextStyle={{ color: COLOR_WHITE_1, fontSize: 13 }}
                                            activeColor={COLOR_PRIMARY}
                                            data={dataDropdownSensus || []}
                                            search
                                            maxHeight={300}
                                            labelField="label"
                                            valueField="value"
                                            placeholder={`Pilih Nama`}
                                            searchPlaceholder="Search..."
                                            value={dataUpload.user?.label}
                                            onChange={item => {
                                                setDataUpload({
                                                    ...dataUpload,
                                                    user: { ...item, value: item.value, label: item.value }
                                                });
                                            }}
                                        />
                                        <Text style={{ color: COLOR_WHITE_1 }}>Pilih Kategori Pesanan</Text>
                                        <Dropdown
                                            disable={uploading}
                                            style={[styles.dropdown]}
                                            placeholderStyle={styles.placeholderStyle}
                                            selectedTextStyle={styles.selectedTextStyle}
                                            inputSearchStyle={styles.inputSearchStyle}
                                            containerStyle={{ backgroundColor: COLOR_BG_CARD }}
                                            itemTextStyle={{ color: COLOR_WHITE_1, fontSize: 13 }}
                                            activeColor={COLOR_PRIMARY}
                                            data={dataDropdownCategory || []}
                                            search
                                            maxHeight={300}
                                            labelField="label"
                                            valueField="value"
                                            placeholder={'Pilih Kategori'}
                                            searchPlaceholder="Search..."
                                            value={dataUpload.category?.label}
                                            onFocus={fetchListOrder}
                                            onChange={item => {
                                                setDataUpload({
                                                    ...dataUpload,
                                                    category: {
                                                        ...item,
                                                        label: `${item.name} ${item.year}`,
                                                        value: `${item.name} ${item.year}`,
                                                    }
                                                });
                                            }}
                                        />
                                        <Text style={{ color: COLOR_WHITE_1 }}>Jumlah Yang Dipesan</Text>
                                        <TextInput
                                            editable={!uploading}
                                            defaultValue={dataUpload.totalOrder}
                                            style={[styles.dropdown, { color: COLOR_WHITE_1, backgroundColor: isExactChange ? 'gray' : '' }]}
                                            placeholder='Masukkan jumlah pemesanan'
                                            placeholderTextColor={COLOR_TEXT_BODY}
                                            keyboardType='number-pad'
                                            onChangeText={(e) => setDataUpload({ ...dataUpload, totalOrder: e })}
                                        />
                                        <Text style={{ color: COLOR_WHITE_1 }}>Masukkan Catatan Pemesanan</Text>
                                        <TextInput
                                            editable={!uploading}
                                            multiline
                                            textAlignVertical='top'
                                            defaultValue={dataUpload.note}
                                            style={[styles.dropdown, { color: COLOR_WHITE_1, backgroundColor: isExactChange ? 'gray' : '', height: 80 }]}
                                            placeholder='Massukkan catatan'
                                            placeholderTextColor={COLOR_TEXT_BODY}
                                            onChangeText={(e) => setDataUpload({ ...dataUpload, note: e })}
                                        />
                                    </View>

                                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 }}>
                                        <Button
                                            loading={uploading}
                                            onPress={() => !uploading ? handleResetUpload() : null}
                                            textColor={COLOR_PRIMARY}>
                                            Tutup
                                        </Button>
                                        <Button
                                            loading={uploading}
                                            mode='contained'
                                            buttonColor={COLOR_PRIMARY}
                                            onPress={() => !uploading ? handleCreateOrder() : null}
                                            textColor={COLOR_WHITE_1}>
                                            Submit
                                        </Button>
                                    </View>
                                </View>
                            </ScrollView>
                        </KeyboardAvoidingView>
                    </View>
                </Modal>
                {/* MODAL FILTER*/}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={modalFilter}
                    onRequestClose={() => setModalFilter(false)}
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
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                        <Text style={styles.modalTitle}>Filter Options</Text>
                                        <TouchableOpacity
                                            style={[styles.filterButton, { backgroundColor: COLOR_DELETE_1 }]}
                                            onPress={() => {
                                                setSettingFilter({
                                                    category: settingFilter.category,
                                                    isPayment: null
                                                })
                                                setPage(0)
                                            }}
                                        >
                                            <Monicon name="tdesign:clear-filled" size={20} color={COLOR_WHITE_2} />
                                        </TouchableOpacity>
                                    </View>
                                    <View>
                                        {/* <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'space-between' }}>
                                            <Text style={{ color: COLOR_WHITE_1, marginRight: 10 }}>Tampilkan Semua Data</Text>
                                            <Switch
                                                color={COLOR_PRIMARY}
                                                value={showAllData}
                                                onValueChange={() => setShowAllData(!showAllData)}
                                            />
                                        </View> */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'space-between' }}>
                                            <Text style={{ color: COLOR_WHITE_1, marginRight: 10 }}>Sembunyikan Kolom Harga</Text>
                                            <Switch
                                                color={COLOR_PRIMARY}
                                                value={hidePrice}
                                                onValueChange={() => setHidePrice(!hidePrice)}
                                            />
                                        </View>
                                        <Text style={{ color: COLOR_WHITE_1, marginRight: 10 }}>Pilih Kategori</Text>
                                        <Dropdown
                                            disable={uploading}
                                            style={[styles.dropdown]}
                                            placeholderStyle={styles.placeholderStyle}
                                            selectedTextStyle={styles.selectedTextStyle}
                                            inputSearchStyle={styles.inputSearchStyle}
                                            containerStyle={{ backgroundColor: COLOR_BG_CARD }}
                                            itemTextStyle={{ color: COLOR_WHITE_1, fontSize: 13 }}
                                            activeColor={COLOR_PRIMARY}
                                            data={dataDropdownCategory || []}
                                            search
                                            maxHeight={300}
                                            labelField="label"
                                            valueField="value"
                                            placeholder={'Pilih Kategori'}
                                            searchPlaceholder="Search..."
                                            value={settingFilter.category?.label}
                                            onFocus={fetchListOrder}
                                            onChange={item => {
                                                setSettingFilter({
                                                    ...settingFilter,
                                                    category: {
                                                        ...item,
                                                        label: `${item.name} ${item.year}`,
                                                        value: `${item.name} ${item.year}`,
                                                        price: `${item.price}`
                                                    }
                                                });
                                            }}
                                        />
                                        <Text style={{ color: COLOR_WHITE_1, marginRight: 10 }}>Status Pembayaran</Text>
                                        <View style={{ justifyContent: 'space-around', marginBottom: 10, paddingTop: 5, marginLeft: 5 }}>
                                            <TouchableOpacity
                                                style={{ alignItems: 'center', flexDirection: 'row', marginBottom: 5 }}
                                                onPress={() => setSettingFilter({ ...settingFilter, isPayment: settingFilter.isPayment === false ? null : false })}>
                                                <Monicon
                                                    name={settingFilter.isPayment === false ? "mdi:checkbox-marked-circle" : "mdi:checkbox-blank-circle-outline"}
                                                    size={20}
                                                    color={settingFilter.isPayment === false ? COLOR_PRIMARY : COLOR_WHITE_1}
                                                />
                                                <Text style={{ color: COLOR_WHITE_1, marginLeft: 10 }}>Belum Bayar</Text>

                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={{ alignItems: 'center', flexDirection: 'row' }}
                                                onPress={() => setSettingFilter({ ...settingFilter, isPayment: settingFilter.isPayment === true ? null : true })}>
                                                <Monicon
                                                    name={settingFilter.isPayment === true ? "mdi:checkbox-marked-circle" : "mdi:checkbox-blank-circle-outline"}
                                                    size={20}
                                                    color={settingFilter.isPayment === true ? COLOR_PRIMARY : COLOR_WHITE_1}
                                                />
                                                <Text style={{ color: COLOR_WHITE_1, marginLeft: 10 }}>Sudah Bayar</Text>
                                            </TouchableOpacity>

                                        </View>
                                    </View>

                                    <Button
                                        textColor={COLOR_PRIMARY}
                                        onPress={() => {
                                            setModalFilter(false)
                                            setPage(0)
                                        }}
                                    >
                                        Close
                                    </Button>
                                </View>
                            </ScrollView>
                        </KeyboardAvoidingView>
                    </View>
                </Modal>
                <BottomSheet
                    ref={bottomSheetRef}
                    index={-1}
                    snapPoints={snapPoints}
                    onChange={handleSheetChanges}
                    backdropComponent={renderBackdrop}
                    enablePanDownToClose={true}
                    handleIndicatorStyle={{ backgroundColor: COLOR_WHITE_1 }}
                    handleStyle={{ backgroundColor: COLOR_BG_CARD }}
                    style={{ backgroundColor: COLOR_BG_CARD, borderRadius: 20 }}
                    backgroundStyle={{ backgroundColor: COLOR_BG_CARD, borderRadius: 20 }}
                >
                    <View style={styles.bottomSheetHeader}>
                        <Text style={styles.bottomSheetTitle}>Perhitungan Total {settingFilter.category.label}</Text>
                    </View>
                    <BottomSheetView style={styles.contentContainer}>
                        <View style={styles.bottomSheetContent}>
                            <View style={styles.bottomSheetRow}>
                                <Text style={styles.bottomSheetLabel}>Total Pesanan:</Text>
                                <Text style={styles.bottomSheetValue}>{filteredOrder.length}</Text>
                            </View>
                            <View style={styles.bottomSheetRow}>
                                <Text style={styles.bottomSheetLabel}>Total Harga Pesanan:</Text>
                                <Text style={styles.bottomSheetValue}>{formatRupiah(grandTotal.toString())}</Text>
                            </View>
                            <View style={styles.bottomSheetRow}>
                                <Text style={styles.bottomSheetLabel}>Total Uang Yang Diterima:</Text>
                                <Text style={styles.bottomSheetValue}>{formatRupiah(grandTotalActual.toString())}</Text>
                            </View>
                            <View style={styles.bottomSheetRow}>
                                <Text style={styles.bottomSheetLabel}>Sudah Bayar:</Text>
                                <Text style={styles.bottomSheetValue}>{filteredOrder.filter(item => item.is_payment).length}</Text>
                            </View>
                            <View style={styles.bottomSheetRow}>
                                <Text style={styles.bottomSheetLabel}>Belum Bayar:</Text>
                                <Text style={styles.bottomSheetValue}>{filteredOrder.filter(item => !item.is_payment).length}</Text>
                            </View>
                        </View>
                    </BottomSheetView>
                </BottomSheet>
            </BaseScreen >
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    fab: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLOR_PRIMARY,
        marginHorizontal: 10
    },
    contentContainer: {
        flex: 1,
        padding: 15,
        backgroundColor: COLOR_BG_CARD,
        alignItems: 'center',
    },
    firstColumn: {
        width: 130,
        color: COLOR_WHITE_1,
    },
    textHeader: {
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
        color: COLOR_WHITE_1,
    },
    textTable: {
        color: COLOR_WHITE_1,
        textAlign: 'center',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLOR_BG_CARD,
    },
    paginationText: {
        color: COLOR_WHITE_1,
    },
    paginationButtons: {
        flexDirection: 'row',
        alignItems: 'center',
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
    searchInput: {
        height: 40,
        borderColor: COLOR_WHITE_1,
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        color: COLOR_WHITE_1,
        flex: 1,
        marginRight: 10
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 10
    },
    filterButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLOR_PRIMARY,
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
        width: '80%',
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
        borderColor: 'gray',
        borderWidth: 0.5,
        borderRadius: 8,
        paddingHorizontal: 8,
        marginTop: 5,
        marginBottom: 10
    },
    icon: {
        marginRight: 5,
    },
    placeholderStyle: {
        fontSize: 13,
        color: COLOR_TEXT_BODY
    },
    selectedTextStyle: {
        fontSize: 13,
        color: COLOR_WHITE_1
    },
    iconStyle: {
        width: 20,
        height: 20,
    },
    inputSearchStyle: {
        height: 40,
        fontSize: 13,
        color: COLOR_WHITE_1
    },
    bottomSheetHeader: {
        backgroundColor: COLOR_BG_CARD,
        paddingBottom: 16,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    bottomSheetTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLOR_WHITE_1,
        textAlign: 'center'
    },
    bottomSheetContent: {
        width: '100%',
        padding: 10,
    },
    bottomSheetRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    bottomSheetLabel: {
        fontSize: 16,
        color: COLOR_WHITE_1,
        flex: 1,
    },
    bottomSheetValue: {
        fontSize: 16,
        color: COLOR_WHITE_1,
        fontWeight: 'bold',
        marginLeft: 10,
    },
});

export default ListOrderScreen;