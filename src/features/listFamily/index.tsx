import React, { useCallback, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, ActivityIndicator, Text, View, TextInput, Modal, TouchableOpacity, Alert } from 'react-native';
import { Button, DataTable } from 'react-native-paper';
import { COLOR_BG_CARD, COLOR_DELETE_1, COLOR_PRIMARY, COLOR_TEXT_BODY, COLOR_WHITE_1, COLOR_WHITE_2 } from '../../utils/constant';
import { DataFamily, DataSensus, ListFamilyProps } from '../../types/';
import { supabase } from '../../config';
import { Monicon } from "@monicon/native";
import { Dropdown } from 'react-native-element-dropdown';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BaseScreen from '../../components/BaseScreen';
import { windowWidth } from '../../utils/helper';

type RootStackParamList = {
    CreateUser: { dataFamily: DataFamily[] | null };
    UpdateUser: { detailUser: DataSensus, dataFamily: DataFamily[] | null };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ListFamilyScreen = () => {
    const navigation = useNavigation<NavigationProp>()
    const [listFamily, setListFamily] = useState<ListFamilyProps[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const [showModalCreate, setShowModalCreate] = useState(false);
    const [showModalUpdate, setShowModalUpdate] = useState(false);
    const [settingFilter, setSettingFilter] = useState({
        grade: { label: '', value: null },
        family: { label: '', value: null, id: null },
        marriage: { label: '', value: null },
        gender: { label: '', value: null },
        user_active: true
    })
    const [familyName, setFamilyName] = useState('');
    const downloadDataFamily = async () => {
        // handleClear();
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('list_family')
                .select('*')
                .order('id', { ascending: true });
            if (error) {
                setError(error.message);
                console.error('Error:', error.message);
                return;
            }
            setListFamily(data);
        } catch (e) {
            console.error('Fetch error:', e);
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };
    const handleSubmit = async () => {
        try {
            if (familyName === '') {
                Alert.alert('INFO', 'Nama Keluarga harus diisi');
                return;
            }

            setUploading(true);

            const { error, status } = await supabase
                .from('list_family')
                .insert([
                    { name: familyName }
                ])
                .select()
            console.log(error, status);

            if (status === 201) {
                downloadDataFamily()
                Alert.alert('Berhasil', 'Data berhasil dibuat')
            } else {
                Alert.alert('ERROORR', error?.message)
            }
        } catch (e: any) {
            Alert.alert('ERROORR', e.message)
        } finally {
            setFamilyName('');
            setShowModalCreate(false);
            setUploading(false);
        }
    };

    const handleUpdate = async () => {
        try {
            if (familyName === '') {
                Alert.alert('INFO', 'Nama Keluarga harus diisi');
                return;
            }

            setUploading(true);

            const { error, status } = await supabase
                .from('list_family')
                .update({ name: familyName })
                .eq('id', selectedId)
                .select()
            if (status === 200) {
                downloadDataFamily()
                Alert.alert('Berhasil', 'Data berhasil diupdate')
            } else {
                Alert.alert('ERROORR', error?.message)
            }
        } catch (e: any) {
            Alert.alert('ERROORR', e.message)
        } finally {
            setFamilyName('');
            setSelectedId(null);
            setShowModalUpdate(false);
            setUploading(false);
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
                            .from('list_family')
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
                            downloadDataFamily(); // Refresh the data
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
        useCallback(() => {
            // if (props.route.params?.refresh) {
            downloadDataFamily();
            // }
        }, [navigation, settingFilter.user_active])
    );

    const filteredFamily = listFamily.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });


    const totalPages = Math.ceil(filteredFamily.length / itemsPerPage);
    const from = page * itemsPerPage;
    const to = Math.min((page + 1) * itemsPerPage, filteredFamily.length);

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

        if (!filteredFamily || filteredFamily.length === 0) {
            return (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={styles.emptyText}>No data available.</Text>
                </View>
            );
        }
        return (
            <View style={{ flex: 1 }}>
                <ScrollView horizontal nestedScrollEnabled>
                    <DataTable>
                        <DataTable.Header>
                            <DataTable.Title textStyle={[styles.textTable, styles.textHeader, { width: windowWidth / 10 }]}>ID</DataTable.Title>
                            <DataTable.Title textStyle={[styles.firstColumn, styles.textHeader]}>KELUARGA</DataTable.Title>
                            <DataTable.Title textStyle={[styles.textTable, styles.textHeader]}>ACTION</DataTable.Title>
                        </DataTable.Header>
                        <ScrollView>
                            {filteredFamily.slice(from, to).map((item) => (
                                <DataTable.Row key={item.id}>
                                    <DataTable.Cell textStyle={[styles.textTable, { width: windowWidth / 10 }]}>{item.id}</DataTable.Cell>
                                    <DataTable.Cell textStyle={[styles.firstColumn]}>{item.name}</DataTable.Cell>
                                    <DataTable.Cell textStyle={[styles.textTable]}>
                                        <View style={{ flexDirection: 'row' }}>
                                            <TouchableOpacity
                                                style={styles.filterButton}
                                                onPress={() => {
                                                    setFamilyName(item.name)
                                                    setSelectedId(item.id)
                                                    setShowModalUpdate(true)
                                                }}>
                                                <Monicon name="material-symbols:edit-square-outline" size={25} color={COLOR_WHITE_1} />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.filterButton, { backgroundColor: COLOR_DELETE_1 }]}
                                                onPress={() => handleDeleteUser(item.id)}>
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
                        Page {page + 1} of {Math.ceil(filteredFamily.length / itemsPerPage)}
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
                    placeholder="Cari nama..."
                    placeholderTextColor={COLOR_TEXT_BODY}
                    value={searchQuery}
                    onChangeText={(e) => {
                        setPage(0)
                        setSearchQuery(e)
                    }}
                />

                <TouchableOpacity style={styles.fab} onPress={() => setShowModalCreate(true)}>
                    <Monicon name="material-symbols:add" size={30} color={COLOR_WHITE_1} />
                </TouchableOpacity>
            </View>
            {renderContent()}
            {/* Modal for Create */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showModalCreate}
                onRequestClose={() => setShowModalCreate(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>TAMBAH DATA</Text>
                        <View>
                            <Text style={{ color: COLOR_WHITE_1 }}>Nama Keluarga</Text>
                            <TextInput
                                editable={!uploading}
                                defaultValue={familyName}
                                style={[styles.dropdown, { color: COLOR_WHITE_1, backgroundColor: COLOR_BG_CARD }]}
                                placeholder='Masukkan nama keluarga'
                                placeholderTextColor={COLOR_WHITE_1}
                                onChangeText={(e) => setFamilyName(e)}
                            />
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 }}>
                            <Button
                                loading={uploading}
                                onPress={() => !uploading ? setShowModalCreate(false) : null}
                                textColor={COLOR_PRIMARY}>
                                Tutup
                            </Button>
                            <Button
                                loading={uploading}
                                mode='contained'
                                buttonColor={COLOR_PRIMARY}
                                onPress={() => !uploading ? handleSubmit() : null}
                                textColor={COLOR_WHITE_1}>
                                Submit
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>
            {/* Modal for Update */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showModalUpdate}
                onRequestClose={() => setShowModalUpdate(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>EDIT DATA</Text>
                        <View>
                            <Text style={{ color: COLOR_WHITE_1 }}>Nama Keluarga</Text>
                            <TextInput
                                editable={!uploading}
                                defaultValue={familyName}
                                style={[styles.dropdown, { color: COLOR_WHITE_1, backgroundColor: COLOR_BG_CARD }]}
                                placeholder='Masukkan nama keluarga'
                                placeholderTextColor={COLOR_WHITE_1}
                                onChangeText={(e) => setFamilyName(e)}
                            />
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 }}>
                            <Button
                                loading={uploading}
                                onPress={() => !uploading ? setShowModalUpdate(false) : null}
                                textColor={COLOR_PRIMARY}>
                                Tutup
                            </Button>
                            <Button
                                loading={uploading}
                                mode='contained'
                                buttonColor={COLOR_PRIMARY}
                                onPress={() => !uploading ? handleUpdate() : null}
                                textColor={COLOR_WHITE_1}>
                                Update
                            </Button>
                        </View>
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
        marginLeft: 10,
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLOR_PRIMARY,
    },
    firstColumn: {
        width: windowWidth / 2,
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
        marginHorizontal: 6,
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

export default ListFamilyScreen;