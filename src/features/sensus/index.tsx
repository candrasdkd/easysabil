import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, ActivityIndicator, Text, View, TextInput, Modal, TouchableOpacity, Alert } from 'react-native';
import { Button, DataTable } from 'react-native-paper';
import { COLOR_BG_CARD, COLOR_DELETE_1, COLOR_PRIMARY, COLOR_TEXT_BODY, COLOR_WHITE_1, COLOR_WHITE_2 } from '../../utils/constant';
import { DataFamily, DataSensus } from '../../types/';
import { supabase } from '../../config';
import { Monicon } from "@monicon/native";
import { Dropdown } from 'react-native-element-dropdown';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BaseScreen from '../../components/BaseScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
    CreateUser: { dataFamily: DataFamily[] | null };
    UpdateUser: { detailUser: DataSensus, dataFamily: DataFamily[] | null };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SensusScreen = () => {
    const navigation = useNavigation<NavigationProp>()
    const [sensus, setSensus] = useState<DataSensus[]>([]);
    const [dataFamily, setDataFamily] = useState<DataFamily[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [userLevel, setUserLevel] = useState<number | null>(null);
    const [settingFilter, setSettingFilter] = useState({
        grade: { label: '', value: null },
        family: { label: '', value: null, id: null },
        marriage: { label: '', value: null },
        gender: { label: '', value: null },
        user_active: true
    })

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

    const fetchSensus = async () => {
        // handleClear();
        try {
            const { data, error } = await supabase
                .from('list_sensus')
                .select('*')
                .order('name', { ascending: true })
                .eq('is_active', settingFilter.user_active);
            if (error) {
                setError(error.message);
                console.error('Error:', error.message);
                return;
            }
            setSensus(data);
        } catch (e) {
            console.error('Fetch error:', e);
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const fetchDataFamily = async () => {
        try {
            const { data, error } = await supabase
                .from('list_family')
                .select('id, name')
                .order('name', { ascending: true });
            if (error) {
                setError(error.message);
                console.error('Error:', error.message);
                return;
            }
            // Transform data into label-value pairs
            const transformedData = data.map(item => ({
                label: item.name,
                value: item.name,
                id: item.id
            }));
            setDataFamily(transformedData);
        } catch (e) {
            console.error('Fetch error:', e);
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id: string) => {
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
                            .from('list_sensus')
                            .delete()
                            .eq('uuid', id);

                        if (error) {
                            setError(error.message);
                            console.error('Error:', error.message);
                            return;
                        }

                        if (status === 204) {
                            handleClear();
                            Alert.alert('Berhasil', 'Data berhasil dihapus');
                            fetchSensus(); // Refresh the data
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
            grade: { label: '', value: null },
            family: { label: '', value: null, id: null },
            marriage: { label: '', value: null },
            gender: { label: '', value: null },
            user_active: true,
        });
    }

    useFocusEffect(
        React.useCallback(() => {
            // if (props.route.params?.refresh) {
            fetchSensus();
            fetchDataFamily();
            // }
        }, [navigation, settingFilter.user_active])
    );

    const filteredSensus = sensus.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.age.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGrade = settingFilter.grade.value ? item.level === settingFilter.grade.value : true;
        const matchesFamily = settingFilter.family.id ? item.id_family === settingFilter.family.id : true;
        const matchesMarriage = settingFilter.marriage.value ? item.marriage_status === settingFilter.marriage.value : true;
        const matchesGender = settingFilter.gender.value ? item.gender === settingFilter.gender.value : true;

        return matchesSearch && matchesGrade && matchesFamily && matchesMarriage && matchesGender;
    });


    const totalPages = Math.ceil(filteredSensus.length / itemsPerPage);
    const from = page * itemsPerPage;
    const to = Math.min((page + 1) * itemsPerPage, filteredSensus.length);

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

        if (!filteredSensus || filteredSensus.length === 0) {
            return (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={styles.emptyText}>No data available.</Text>
                </View>
            );
        }
        return (
            <View style={{ flex: 1 }}>
                <ScrollView nestedScrollEnabled>
                    <DataTable style={{ flexDirection: 'row', flex: 1 }}>
                        <View style={{ position: 'relative', width: 150 }}>
                            <DataTable.Header>
                                <DataTable.Title textStyle={[styles.firstColumn, styles.textHeader]}>NAME</DataTable.Title>
                            </DataTable.Header>
                            {filteredSensus.slice(from, to).map((item) => (
                                <DataTable.Row key={item.uuid}>
                                    <DataTable.Cell textStyle={[styles.firstColumn, { width: 120 }]}>{item.name}</DataTable.Cell>
                                </DataTable.Row>
                            ))}
                        </View>

                        <ScrollView horizontal nestedScrollEnabled>
                            <View>
                                <DataTable.Header>
                                    <DataTable.Title textStyle={[styles.textTable, styles.textHeader, { width: 120 }]}>GRADE</DataTable.Title>
                                    <DataTable.Title textStyle={[styles.textTable, styles.textHeader, { width: 120 }]}>GENDER</DataTable.Title>
                                    <DataTable.Title textStyle={[styles.textTable, styles.textHeader, { width: 120 }]}>DOB</DataTable.Title>
                                    <DataTable.Title textStyle={[styles.textTable, styles.textHeader, { width: 120 }]}>AGE</DataTable.Title>
                                    <DataTable.Title textStyle={[styles.textTable, styles.textHeader, { width: 120 }]}>STATUS</DataTable.Title>
                                    {userLevel === 0 && (
                                        <DataTable.Title textStyle={[styles.textTable, styles.textHeader, { width: 150 }]}>ACTION</DataTable.Title>
                                    )}
                                </DataTable.Header>
                                {filteredSensus.slice(from, to).map((item) => (
                                    <DataTable.Row key={item.uuid}>
                                        <DataTable.Cell textStyle={[styles.textTable, { width: 120 }]}>{item.level}</DataTable.Cell>
                                        <DataTable.Cell textStyle={[styles.textTable, { width: 120 }]}>{item.gender}</DataTable.Cell>
                                        <DataTable.Cell textStyle={[styles.textTable, { width: 120 }]}>{new Date(item.date_of_birth).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}</DataTable.Cell>
                                        <DataTable.Cell textStyle={[styles.textTable, { width: 120 }]}>{item.age}</DataTable.Cell>
                                        <DataTable.Cell textStyle={[styles.textTable, { width: 120 }]}>{item.marriage_status}</DataTable.Cell>
                                        {userLevel === 0 && (
                                            <DataTable.Cell textStyle={[styles.textTable, { width: 150 }]}>
                                                <View style={{ flexDirection: 'row', width: 150, justifyContent: 'center' }}>
                                                    <TouchableOpacity
                                                        style={styles.filterButton}
                                                        onPress={() => navigation.navigate('UpdateUser', { detailUser: item, dataFamily: dataFamily || [] })}>
                                                        <Monicon name="material-symbols:edit-square-outline" size={25} color={COLOR_WHITE_1} />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[styles.filterButton, { backgroundColor: COLOR_DELETE_1 }]}
                                                        onPress={() => handleDeleteUser(item.uuid)}>
                                                        <Monicon name="material-symbols:delete-outline-sharp" size={25} color={COLOR_WHITE_1} />
                                                    </TouchableOpacity>
                                                </View>
                                            </DataTable.Cell>
                                        )}
                                    </DataTable.Row>
                                ))}
                            </View>
                        </ScrollView>
                    </DataTable>
                </ScrollView>

                <View style={styles.paginationContainer}>
                    <Text style={styles.paginationText}>
                        Page {page + 1} of {Math.ceil(filteredSensus.length / itemsPerPage)}
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
            </View>
        )
    }

    return (
        <BaseScreen>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Cari nama atau usia..."
                    placeholderTextColor={COLOR_TEXT_BODY}
                    value={searchQuery}
                    onChangeText={(e) => {
                        setPage(0)
                        setSearchQuery(e)
                    }}
                />

                <TouchableOpacity style={styles.filterButton} onPress={() => setModalVisible(true)} >
                    <Monicon name="mdi-light:settings" size={30} color={COLOR_WHITE_1} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateUser', { dataFamily: dataFamily || [] })}>
                    <Monicon name="material-symbols:add" size={30} color={COLOR_WHITE_1} />
                </TouchableOpacity>
            </View>
            {renderContent()}
            {/* Modal for Filter Options */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <Text style={styles.modalTitle}>Filter Options</Text>
                            <TouchableOpacity
                                style={[styles.filterButton, { backgroundColor: COLOR_DELETE_1 }]}
                                onPress={() => {
                                    setSettingFilter({
                                        grade: { label: '', value: null },
                                        family: { label: '', value: null, id: null },
                                        marriage: { label: '', value: null },
                                        gender: { label: '', value: null },
                                        user_active: true,
                                    })
                                    setPage(0)
                                }}
                            >
                                <Monicon name="tdesign:clear-filled" size={20} color={COLOR_WHITE_2} />
                            </TouchableOpacity>
                        </View>
                        <View>
                            <Text style={{ color: COLOR_WHITE_1 }}>Dari Keluarga</Text>
                            <Dropdown
                                style={[styles.dropdown]}
                                placeholderStyle={styles.placeholderStyle}
                                selectedTextStyle={styles.selectedTextStyle}
                                inputSearchStyle={styles.inputSearchStyle}
                                containerStyle={{ backgroundColor: COLOR_BG_CARD }}
                                itemTextStyle={{ color: COLOR_WHITE_1, fontSize: 13 }}
                                activeColor={COLOR_PRIMARY}
                                data={dataFamily || []}
                                search
                                maxHeight={300}
                                labelField="label"
                                valueField="value"
                                placeholder={'Pilih Nama Keluarga'}
                                searchPlaceholder="Search..."
                                value={settingFilter.family.label}
                                onChange={item => {
                                    setSettingFilter({
                                        ...settingFilter,
                                        family: item
                                    });
                                }}
                            />
                            <Text style={{ color: COLOR_WHITE_1 }}>Pilih Jenjang</Text>
                            <Dropdown
                                style={[styles.dropdown]}
                                placeholderStyle={styles.placeholderStyle}
                                selectedTextStyle={styles.selectedTextStyle}
                                inputSearchStyle={styles.inputSearchStyle}
                                iconStyle={styles.iconStyle}
                                containerStyle={{ backgroundColor: COLOR_BG_CARD }}
                                itemTextStyle={{ color: COLOR_WHITE_1, fontSize: 13 }}
                                activeColor={COLOR_PRIMARY}
                                data={[
                                    { label: 'Balita', value: 'Balita' },
                                    { label: 'Cabe Rawit', value: 'Cabe Rawit' },
                                    { label: 'Pra Remaja', value: 'Pra Remaja' },
                                    { label: 'Remaja', value: 'Remaja' },
                                    { label: 'Pra Nikah', value: 'Pra Nikah' },
                                    { label: 'Dewasa', value: 'Dewasa' },
                                ]}
                                maxHeight={300}
                                labelField="label"
                                valueField="value"
                                placeholder={'Pilih Jenjang'}
                                value={settingFilter.grade.label}
                                onChange={item => {
                                    setSettingFilter({
                                        ...settingFilter,
                                        grade: item
                                    });
                                }}
                            />
                            <Text style={{ color: COLOR_WHITE_1 }}>Pilih Jenis kelamin</Text>
                            <Dropdown
                                style={[styles.dropdown]}
                                placeholderStyle={styles.placeholderStyle}
                                selectedTextStyle={styles.selectedTextStyle}
                                inputSearchStyle={styles.inputSearchStyle}
                                iconStyle={styles.iconStyle}
                                containerStyle={{ backgroundColor: COLOR_BG_CARD }}
                                itemTextStyle={{ color: COLOR_WHITE_1, fontSize: 13 }}
                                activeColor={COLOR_PRIMARY}
                                data={[
                                    { label: 'Laki - Laki', value: 'Laki - Laki' },
                                    { label: 'Perempuan', value: 'Perempuan' },
                                ]}
                                maxHeight={300}
                                labelField="label"
                                valueField="value"
                                placeholder={'Pilih Jenjang'}
                                value={settingFilter.gender.label}
                                onChange={item => {
                                    setSettingFilter({
                                        ...settingFilter,
                                        gender: item
                                    });
                                }}
                            />
                            <Text style={{ color: COLOR_WHITE_1 }}>Pilih Status Pernikahan</Text>
                            <Dropdown
                                style={[styles.dropdown]}
                                placeholderStyle={styles.placeholderStyle}
                                selectedTextStyle={styles.selectedTextStyle}
                                inputSearchStyle={styles.inputSearchStyle}
                                iconStyle={styles.iconStyle}
                                containerStyle={{ backgroundColor: COLOR_BG_CARD }}
                                itemTextStyle={{ color: COLOR_WHITE_1, fontSize: 13 }}
                                activeColor={COLOR_PRIMARY}
                                data={[
                                    { label: 'Belum Menikah', value: 'Belum Menikah' },
                                    { label: 'Menikah', value: 'Menikah' },
                                    { label: 'Janda', value: 'Janda' },
                                    { label: 'Duda', value: 'Duda' },
                                ]}
                                maxHeight={300}
                                labelField="label"
                                valueField="value"
                                placeholder={'Pilih Status Pernikahan'}
                                value={settingFilter.marriage.label}
                                onChange={item => {
                                    setSettingFilter({
                                        ...settingFilter,
                                        marriage: item
                                    });
                                }}
                            />
                            <Text style={{ color: COLOR_WHITE_1, marginRight: 10 }}>Status Anggota</Text>
                            <View style={{ justifyContent: 'space-around', marginBottom: 10, paddingTop: 5, marginLeft: 5 }}>
                                <TouchableOpacity
                                    style={{ alignItems: 'center', flexDirection: 'row', marginBottom: 5 }}
                                    onPress={() => setSettingFilter({ ...settingFilter, user_active: false })}>
                                    <Monicon
                                        name={settingFilter.user_active === false ? "mdi:checkbox-marked-circle" : "mdi:checkbox-blank-circle-outline"}
                                        size={20}
                                        color={settingFilter.user_active === false ? COLOR_PRIMARY : COLOR_WHITE_1}
                                    />
                                    <Text style={{ color: COLOR_WHITE_1, marginLeft: 10 }}>Tidak Aktif</Text>

                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{ alignItems: 'center', flexDirection: 'row' }}
                                    onPress={() => setSettingFilter({ ...settingFilter, user_active: true })}>
                                    <Monicon
                                        name={settingFilter.user_active === true ? "mdi:checkbox-marked-circle" : "mdi:checkbox-blank-circle-outline"}
                                        size={20}
                                        color={settingFilter.user_active === true ? COLOR_PRIMARY : COLOR_WHITE_1}
                                    />
                                    <Text style={{ color: COLOR_WHITE_1, marginLeft: 10 }}>Aktif</Text>
                                </TouchableOpacity>

                            </View>
                        </View>

                        <Button
                            textColor={COLOR_PRIMARY}
                            onPress={() => {
                                setModalVisible(false)
                                setPage(0)
                            }}
                        >
                            Close
                        </Button>
                    </View>
                </View>
            </Modal>
        </BaseScreen>
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
        fontSize: 18,
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
        margin: 16,
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
        marginBottom: 10,
        marginTop: 5,
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

export default SensusScreen;