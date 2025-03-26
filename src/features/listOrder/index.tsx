import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, ActivityIndicator, Text, View, TextInput, Modal, TouchableOpacity, Alert, Pressable, KeyboardAvoidingView } from 'react-native';
import { Button, DataTable, Switch } from 'react-native-paper';
import { COLOR_BG_CARD, COLOR_DELETE_1, COLOR_PRIMARY, COLOR_TEXT_BODY, COLOR_WHITE_1, COLOR_WHITE_2 } from '../../utils/constant';
import { DataDropdown, DataOrder } from '../../types/';
import { supabase } from '../../config';
import { Monicon } from "@monicon/native";
import { Dropdown } from 'react-native-element-dropdown';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { formatRupiah, ios } from '../../utils/helper';
import BaseScreen from '../../components/BaseScreen';


const ListOrderScreen = () => {
    // const route = useRoute<RouteProp<{ params: ListOrderRouteParams }>>();
    // const { dataCategory } = route.params;
    const navigation = useNavigation()
    const [dataOrder, setDataOrder] = useState<DataOrder[]>([]);
    const [dataDropdownSensus, setDataDropdownSensus] = useState<DataDropdown[]>([]);
    const [dataDropdownCategory, setDataDropdownCategory] = useState<DataDropdown[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [modalCreate, setModalCreate] = useState(false);
    const [modalFilter, setModalFilter] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showAllData, setShowAllData] = useState(false);
    const [settingFilter, setSettingFilter] = useState({
        category: { label: '', value: '', id: '', name: '', price: '' },
        isPayment: null as boolean | null
    });
    const [dataUpload, setDataUpload] = useState({
        user: { label: '', value: '', uuid: '' },
        category: { label: '', value: '', id: '', name: '', price: '' },
        totalOrder: '',
    })
    const [actualPrice, setActualPrice] = useState('');
    const [isExactChange, setIsExactChange] = useState(false);
    const [detailData, setDetailData] = useState({
        id: 0,
        price: '',
        status: false
    });

    const onToggleSwitch = () => setIsExactChange(!isExactChange);

    const fetchDataOrder = async () => {
        let response
        try {
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
                ...item,
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
            const selectionPrice = isExactChange ? detailData.price : actualPrice;
            const numericPrice = parseInt(selectionPrice.replace(/[^0-9]/g, ''), 10) || 0; // Convert to number
            if (numericPrice === 0 || numericPrice === null) {
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
            if (!dataUpload?.user?.value || !dataUpload?.user?.uuid ||
                !dataUpload?.category?.id || !dataUpload?.category?.name ||
                !dataUpload?.totalOrder) {
                Alert.alert('Info', 'Semua field harus diisi');
                return;
            }

            setUploading(true);
            const transformBody = {
                user_name: dataUpload?.user.value,
                user_id: dataUpload.user?.uuid,
                id_category_order: parseInt(dataUpload?.category.id),
                name_category: dataUpload?.category.name,
                total_order: parseInt(dataUpload.totalOrder),
                unit_price: parseInt(dataUpload?.category.price)
            };


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
            user: { label: '', value: '', uuid: '' },
            category: { label: '', value: '', id: '', name: '', price: '' },
            totalOrder: '',
        });
        setIsExactChange(false);
        setModalCreate(!modalCreate);
    }

    useFocusEffect(
        React.useCallback(() => {
            // if (props.route.params?.refresh) {
            if (settingFilter.category.id || showAllData) {
                fetchDataOrder();
            }
            // fetchSensus();
            // }
        }, [navigation, settingFilter.category.id, showAllData])
    );


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
                {!dataOrder || dataOrder.length === 0 ?
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={styles.emptyText}>No data available.</Text>
                    </View> :
                    <>
                        <ScrollView horizontal nestedScrollEnabled>
                            <DataTable>
                                <DataTable.Header>
                                    <DataTable.Title textStyle={[{ width: 100 }]}>
                                        <View>
                                            <Text style={styles.textHeader}>STATUS</Text>
                                            <Text style={styles.textHeader}>PEMBAYARAN</Text>
                                        </View>
                                    </DataTable.Title>
                                    <DataTable.Title textStyle={[styles.firstColumn, styles.textHeader]}>NAMA</DataTable.Title>
                                    <DataTable.Title textStyle={[styles.firstColumn, styles.textHeader]}>KATEGORI</DataTable.Title>
                                    <DataTable.Title textStyle={[styles.textHeader, { width: 80 }]}>JUMLAH</DataTable.Title>
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
                                    <DataTable.Title textStyle={[styles.textHeader, { width: 200 }]}>ACTION</DataTable.Title>
                                </DataTable.Header>
                                <ScrollView>
                                    {filteredOrder.slice(from, to).map((item) => (
                                        <DataTable.Row key={item.id}>
                                            <DataTable.Cell textStyle={[styles.textTable, { width: 100, alignItems: "center" }]}>
                                                <View style={{ width: 100 }}>
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
                                            <DataTable.Cell textStyle={[styles.firstColumn]}>{item.user_name}</DataTable.Cell>
                                            <DataTable.Cell textStyle={[styles.firstColumn, { textAlign: 'center' }]}>{item.name_category}</DataTable.Cell>
                                            <DataTable.Cell textStyle={[styles.textTable, { width: 80 }]}>{item.total_order} pcs</DataTable.Cell>
                                            <DataTable.Cell textStyle={[styles.textTable, { width: 100 }]}>{formatRupiah(item.unit_price.toString())}</DataTable.Cell>
                                            <DataTable.Cell textStyle={[styles.textTable, { width: 100 }]}>{formatRupiah(totalPrice(item.unit_price, item.total_order))}</DataTable.Cell>
                                            <DataTable.Cell textStyle={[styles.textTable, { width: 100 }]}>{formatRupiah(item.actual_price.toString())}</DataTable.Cell>
                                            <DataTable.Cell textStyle={[styles.textTable, { width: 200 }]}>
                                                <View style={{ flexDirection: 'row', width: 200, justifyContent: 'center' }}>
                                                    <TouchableOpacity
                                                        style={styles.filterButton}
                                                    // onPress={() => navigation.navigate('UpdateUser', { detailUser: item, dataFamily: dataFamily || [] })}>
                                                    >
                                                        <Monicon name="material-symbols:edit-square-outline" size={25} color={COLOR_WHITE_1} />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[styles.filterButton, { backgroundColor: COLOR_DELETE_1 }]}
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
                                    onPress={() => setPage(page - 1)}
                                    textColor={COLOR_PRIMARY}
                                >
                                    Previous
                                </Button>
                                <Button
                                    disabled={page >= totalPages - 1}
                                    onPress={() => setPage(page + 1)}
                                    textColor={COLOR_PRIMARY}
                                >
                                    Next
                                </Button>
                            </View>
                        </View>
                        <Button
                            // disabled={uploading}
                            mode='contained'
                            style={{ backgroundColor: COLOR_PRIMARY, marginHorizontal: 20 }}
                            textColor={COLOR_WHITE_1}
                            onPress={() => Alert.alert('Info','Sedang tahap pengembangan')}>
                            <Text>Tampilkan Perhitungan</Text>
                        </Button>
                    </>
                }
            </>
        )
    }

    return (
        <BaseScreen>
            {settingFilter.category.id || showAllData ?
                <>
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by name"
                            placeholderTextColor={COLOR_TEXT_BODY}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />

                        <TouchableOpacity style={styles.filterButton} onPress={() => setModalFilter(true)} >
                            <Monicon name="material-symbols:filter-alt" size={30} color={COLOR_WHITE_1} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.fab} onPress={() => setModalCreate(true)}>
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
                                style={[styles.dropdown, { color: COLOR_WHITE_1, backgroundColor: isExactChange ? 'gray' : '' }]}
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
                visible={modalCreate}
                onRequestClose={() => setModalCreate(false)}
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
                                    <Text style={styles.modalTitle}>TAMBAH DATA</Text>
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
                                        onFocus={fetchSensus}
                                        onChange={item => {
                                            setDataUpload({
                                                ...dataUpload,
                                                user: { ...item, value: item.name, label: item.name }
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
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <Text style={styles.modalTitle}>Filter Options</Text>
                                    <TouchableOpacity
                                        style={[styles.filterButton, { backgroundColor: COLOR_DELETE_1 }]}
                                        onPress={() => {
                                            setSettingFilter({
                                                category: settingFilter.category,
                                                isPayment: null
                                            })
                                        }}
                                    >
                                        <Monicon name="tdesign:clear-filled" size={20} color={COLOR_WHITE_2} />
                                    </TouchableOpacity>
                                </View>
                                <View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                        <Text style={{ color: COLOR_WHITE_1, marginRight: 10 }}>Tampilkan Semua Data</Text>
                                        <Switch
                                            color={COLOR_PRIMARY}
                                            value={showAllData}
                                            onValueChange={() => setShowAllData(!showAllData)}
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
                                            onPress={() => setSettingFilter({ ...settingFilter, isPayment: false })}>
                                            <Monicon
                                                name={settingFilter.isPayment === false ? "mdi:checkbox-marked-circle" : "mdi:checkbox-blank-circle-outline"}
                                                size={20}
                                                color={settingFilter.isPayment === false ? COLOR_PRIMARY : COLOR_WHITE_1}
                                            />
                                            <Text style={{ color: COLOR_WHITE_1, marginLeft: 10 }}>Belum Bayar</Text>

                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={{ alignItems: 'center', flexDirection: 'row' }}
                                            onPress={() => setSettingFilter({ ...settingFilter, isPayment: true })}>
                                            <Monicon
                                                name={settingFilter.isPayment === true ? "mdi:checkbox-marked-circle" : "mdi:checkbox-blank-circle-outline"}
                                                size={20}
                                                color={settingFilter.isPayment === true ? COLOR_PRIMARY : COLOR_WHITE_1}
                                            />
                                            <Text style={{ color: COLOR_WHITE_1, marginLeft: 10 }}>Sudah Bayar</Text>
                                        </TouchableOpacity>

                                    </View>
                                </View>

                                <Button onPress={() => setModalFilter(false)} textColor={COLOR_PRIMARY}>Close</Button>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
            {/* <View style={{ marginBottom: 20 }}> */}


            {/* </View> */}


        </BaseScreen >
    );
};

const styles = StyleSheet.create({
    fab: {
        // position: 'absolute',
        // right: 15,
        // bottom: 60,
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLOR_PRIMARY,
    },
    firstColumn: {
        width: 150,
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
        flex: 1
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 10
    },
    filterButton: {
        marginHorizontal: 10,
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
});

export default ListOrderScreen;