import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Dropdown } from 'react-native-element-dropdown';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { DataFamily } from '../../types';
import { COLOR_BG_CARD, COLOR_PRIMARY, COLOR_TEXT_BODY, COLOR_WHITE_1 } from '../../utils/constant';
import { Button, Switch, } from 'react-native-paper';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { supabase } from '../../config';
import { ios } from '../../utils/helper';

type CreateUserRouteParams = {
    dataFamily: DataFamily[]; // Adjust this type based on your actual DataFamily type
};
const CreateUser = () => {
    const route = useRoute<RouteProp<{ params: CreateUserRouteParams }>>();
    const navigation = useNavigation()
    const [showCalendar, setShowCalendar] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [bodyUser, setBodyUser] = useState({
        fullname: '',
        dob: '',
        educate: false,
        active: true,
        duafa: false,
        gender: { label: '', value: '' },
        grade: { label: '', value: '' },
        family: { label: '', value: '', id: '' },
        marriage: { label: '', value: '' },
    })

    const handleSubmitUser = async () => {
        try {
            if (!bodyUser.fullname.trim()) {
                Alert.alert('INFO', 'Nama lengkap harus diisi.');
                return;
            }
            if (!bodyUser.dob) {
                Alert.alert('INFO', 'Tanggal lahir harus diisi.');
                return;
            }
            if (!bodyUser.gender.value) {
                Alert.alert('INFO', 'Jenis kelamin harus diisi.');
                return;
            }
            if (!bodyUser.grade.value) {
                Alert.alert('INFO', 'Jenjang harus diisi.');
                return;
            }
            if (!bodyUser.family.value) {
                Alert.alert('INFO', 'Nama keluarga harus diisi.');
                return;
            }
            if (!bodyUser.marriage.value) {
                Alert.alert('INFO', 'Status pernikahan harus diisi.');
                return;
            }

            setUploading(true);
            // Calculate age
            const birthDate = new Date(bodyUser?.dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            // Adjust age if birthday hasn't occurred this year
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            const transformBody = {
                name: bodyUser?.fullname,
                date_of_birth: bodyUser?.dob,
                gender: bodyUser?.gender.value,
                level: bodyUser?.grade.value,
                age: `${age} Tahun`,
                marriage_status: bodyUser?.marriage.value,
                id_family: bodyUser?.family.id,
                family_name: bodyUser?.family.label,
                is_educate: bodyUser?.educate,
            }
            const { error, status } = await supabase
                .from('list_sensus')
                .insert([
                    transformBody
                ])
                .select()
            if (status === 201) {
                Alert.alert('Berhasil', 'Data berhasil dibuat')
                navigation.goBack()
                setUploading(false);
            } else {
                Alert.alert('ERROORR', error?.message)
                setUploading(false);
            }
        } catch (e: any) {
            Alert.alert('ERROORR', e.message)
            setUploading(false);
        } finally {
            setUploading(false);
        }
    };

    LocaleConfig.locales['id'] = {
        monthNames: [
            'Januari',
            'Februari',
            'Maret',
            'April',
            'Mei',
            'Juni',
            'Juli',
            'Agustus',
            'September',
            'Oktober',
            'November',
            'Desember'
        ],
        monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
        dayNames: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
        dayNamesShort: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
        today: "Hari ini"
    };
    LocaleConfig.defaultLocale = 'id';
    const ageGroups = [
        { key: 'Balita', range: '0-5 tahun' },
        { key: 'Cabe Rawit', range: '6-12 tahun' },
        { key: 'Pra Remaja', range: '12-15 tahun' },
        { key: 'Remaja', range: '16-19 tahun' },
        { key: 'Pra Nikah', range: '19-30 tahun' },
        { key: 'Dewasa', range: '30 Tahun Keatas/Sudah menikah' },
    ];
    useEffect(() => {
        if (bodyUser.grade.value && bodyUser.grade.value !== 'Dewasa') {
            setBodyUser({ ...bodyUser, marriage: { label: 'Belum Menikah', value: 'Belum Menikah' } })
        }
    }, [bodyUser.grade])

    return (
        <View style={{ flex: 1 }}>
            <View style={{ marginBottom: 5, flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginLeft: 20 }}>
                <View style={{ flex: 1, minWidth: '45%' }}>
                    <Text style={{ color: COLOR_TEXT_BODY, fontSize: 12 }}>• Balita: 0-5 tahun</Text>
                </View>
                <View style={{ flex: 1, minWidth: '45%' }}>
                    <Text style={{ color: COLOR_TEXT_BODY, fontSize: 12 }}>• Cabe Rawit: 6-12 tahun</Text>
                </View>
                <View style={{ flex: 1, minWidth: '45%' }}>
                    <Text style={{ color: COLOR_TEXT_BODY, fontSize: 12 }}>• Pra Remaja: 12-15 tahun</Text>
                </View>
                <View style={{ flex: 1, minWidth: '45%' }}>
                    <Text style={{ color: COLOR_TEXT_BODY, fontSize: 12 }}>• Remaja: 16-19 tahun</Text>
                </View>
                <View style={{ flex: 1, minWidth: '45%' }}>
                    <Text style={{ color: COLOR_TEXT_BODY, fontSize: 12 }}>• Pra Nikah: 19-30 tahun</Text>
                </View>
                <View style={{ flex: 1, minWidth: '45%' }}>
                    <Text style={{ color: COLOR_TEXT_BODY, fontSize: 12 }}>• Dewasa: 30 Tahun Keatas/Sudah menikah</Text>
                </View>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150, paddingTop: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ color: COLOR_WHITE_1, marginRight: 10 }}>Pengguna Aktif?</Text>
                    <Switch
                        color={COLOR_PRIMARY}
                        value={bodyUser.active}
                        onValueChange={() => setBodyUser({ ...bodyUser, active: !bodyUser.active })}
                    />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ color: COLOR_WHITE_1, marginRight: 10 }}>Pengguna Dalam Binaan?</Text>
                    <Switch
                        color={COLOR_PRIMARY}
                        value={bodyUser.educate}
                        onValueChange={() => setBodyUser({ ...bodyUser, educate: !bodyUser.educate })}
                    />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ color: COLOR_WHITE_1, marginRight: 10 }}>Pengguna Duafa?</Text>
                    <Switch
                        color={COLOR_PRIMARY}
                        value={bodyUser.duafa}
                        onValueChange={() => setBodyUser({ ...bodyUser, duafa: !bodyUser.duafa })}
                    />
                </View>
                <Text style={{ color: COLOR_WHITE_1 }}>Dari Keluarga</Text>
                <Dropdown
                    disable={uploading}
                    style={[styles.dropdown]}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    containerStyle={{ backgroundColor: COLOR_BG_CARD }}
                    itemTextStyle={{ color: COLOR_WHITE_1, fontSize: 13 }}
                    searchPlaceholderTextColor={COLOR_TEXT_BODY}
                    activeColor={COLOR_PRIMARY}
                    data={route.params.dataFamily || []}
                    search
                    showsVerticalScrollIndicator
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder={'Pilih Nama Keluarga'}
                    searchPlaceholder="Search..."
                    value={bodyUser.family.label}
                    onChange={item => {
                        setBodyUser({
                            ...bodyUser,
                            family: item
                        });
                    }}
                />
                <Text style={{ color: COLOR_WHITE_1 }}>Nama Lengkap</Text>
                <TextInput
                    editable={!uploading}
                    defaultValue={bodyUser?.fullname}
                    style={[styles.dropdown, { color: COLOR_WHITE_1 }]}
                    placeholder='Masukkan Nama Lengkap'
                    placeholderTextColor={COLOR_TEXT_BODY}
                    onChangeText={(e) => setBodyUser({ ...bodyUser, fullname: e })}
                />
                <Text style={{ color: COLOR_WHITE_1 }}>Tanggal Lahir</Text>
                <TouchableOpacity
                    disabled={uploading}
                    style={[styles.dropdown, { justifyContent: 'center' }]}
                    onPress={() => setShowCalendar(!showCalendar)}>
                    <Text style={{ color: bodyUser.dob ? COLOR_WHITE_1 : COLOR_TEXT_BODY, fontSize: 13 }}>
                        {bodyUser?.dob ?
                            new Date(bodyUser.dob).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })
                            : 'Pilih Tanggal Lahir'
                        }
                    </Text>
                </TouchableOpacity>
                <Text style={{ color: COLOR_WHITE_1 }}>Usia</Text>
                <TextInput
                    editable={false}
                    value={bodyUser.dob ? (() => {
                        const birthDate = new Date(bodyUser.dob);
                        const today = new Date();
                        let years = today.getFullYear() - birthDate.getFullYear();
                        let months = today.getMonth() - birthDate.getMonth();

                        // Adjust for negative months
                        if (months < 0) {
                            years--;
                            months += 12;
                        }

                        // Adjust if birthday hasn't occurred this month
                        if (today.getDate() < birthDate.getDate()) {
                            months--;
                            if (months < 0) {
                                years--;
                                months += 12;
                            }
                        }

                        return `${years} Tahun ${months} Bulan`;
                    })() : ''}
                    style={[styles.dropdown, { color: COLOR_WHITE_1, backgroundColor: 'gray' }]}
                    placeholder='Usia akan otomatis terisi'
                    placeholderTextColor={COLOR_TEXT_BODY}
                />
                <Text style={{ color: COLOR_WHITE_1 }}>Jenis Kelamin</Text>
                <Dropdown
                    disable={uploading}
                    style={[styles.dropdown]}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
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
                    placeholder={'Pilih Jenis Kelamin'}
                    value={bodyUser.gender.label}
                    onChange={item => {
                        setBodyUser({
                            ...bodyUser,
                            gender: item
                        });
                    }}
                />
                <Text style={{ color: COLOR_WHITE_1 }}>Jenjang</Text>
                <Dropdown
                    disable={uploading}
                    style={[styles.dropdown]}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
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
                    value={bodyUser.grade.label}
                    onChange={item => {
                        setBodyUser({
                            ...bodyUser,
                            grade: item,
                        });
                    }}
                />

                <Text style={{ color: COLOR_WHITE_1 }}>Status Pernikahan</Text>
                <Dropdown
                    disable={uploading}
                    style={[styles.dropdown]}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
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
                    value={bodyUser.marriage.label}
                    onChange={item => {
                        setBodyUser({
                            ...bodyUser,
                            marriage: item
                        });
                    }}
                />
            </ScrollView>
            <Modal
                animationType="fade"
                transparent={true}
                statusBarTranslucent
                visible={showCalendar}
                onRequestClose={() => setShowCalendar(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Calendar
                            initialDate={bodyUser?.dob}
                            monthFormat={'MMMM yyyy'}
                            onDayPress={day => {
                                setBodyUser({ ...bodyUser, dob: day.dateString });
                            }}
                            hideArrows={true}
                            showSixWeeks={true}
                            hideExtraDays={true}

                            renderHeader={(date) => {
                                const currentYear = new Date().getFullYear();
                                const year = date.getFullYear();
                                const month = date.getMonth();

                                // Generate years from 1950 to current year
                                const years = Array.from(
                                    { length: currentYear - 1950 + 1 },
                                    (_, i) => ({
                                        label: `${1950 + i}`,
                                        value: 1950 + i
                                    })
                                ).sort((a, b) => b.value - a.value);

                                return (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
                                        <Dropdown
                                            style={[styles.dropdownDate, { marginRight: 10 }]}
                                            placeholderStyle={styles.placeholderStyle}
                                            selectedTextStyle={styles.selectedTextStyle}
                                            inputSearchStyle={styles.inputSearchStyle}
                                            containerStyle={{ backgroundColor: COLOR_BG_CARD }}
                                            itemTextStyle={{ color: COLOR_WHITE_1, fontSize: 13 }}
                                            activeColor={COLOR_PRIMARY}
                                            data={Array.from({ length: 12 }, (_, i) => ({
                                                label: LocaleConfig.locales['id'].monthNames[i],
                                                value: i
                                            }))}
                                            search
                                            maxHeight={300}
                                            labelField="label"
                                            valueField="value"
                                            placeholder={LocaleConfig.locales['id'].monthNames[month]}
                                            // value={month}
                                            onChange={item => {
                                                date.setMonth(item.value);
                                                setBodyUser({ ...bodyUser, dob: date.toISOString().split('T')[0] });
                                            }}
                                        />
                                        <Dropdown
                                            style={styles.dropdownDate}
                                            placeholderStyle={styles.placeholderStyle}
                                            selectedTextStyle={styles.selectedTextStyle}
                                            inputSearchStyle={styles.inputSearchStyle}
                                            containerStyle={{ backgroundColor: COLOR_BG_CARD }}
                                            itemTextStyle={{ color: COLOR_WHITE_1, fontSize: 13 }}
                                            activeColor={COLOR_PRIMARY}
                                            search
                                            data={years}
                                            maxHeight={300}
                                            labelField="label"
                                            valueField="value"
                                            placeholder={year.toString()}
                                            // value={year}
                                            onChange={item => {
                                                date.setFullYear(item.value);
                                                setBodyUser({ ...bodyUser, dob: date.toISOString().split('T')[0] });
                                            }}
                                        />
                                    </View>
                                );
                            }}
                            theme={{
                                backgroundColor: COLOR_BG_CARD,
                                calendarBackground: COLOR_BG_CARD,
                                textSectionTitleColor: COLOR_PRIMARY,
                                selectedDayBackgroundColor: COLOR_PRIMARY,
                                selectedDayTextColor: COLOR_WHITE_1,
                                todayTextColor: COLOR_PRIMARY,
                                dayTextColor: COLOR_WHITE_1,
                                textDisabledColor: 'gray',
                                arrowColor: COLOR_PRIMARY,
                                monthTextColor: COLOR_WHITE_1,
                            }}
                            markedDates={{
                                [bodyUser.dob]: { selected: true, disableTouchEvent: true }
                            }}
                        />

                        <Button onPress={() => setShowCalendar(false)} buttonColor={COLOR_PRIMARY} style={{ borderRadius: 0 }} textColor={COLOR_WHITE_1}>Close</Button>
                    </View>
                </View>
            </Modal>

            <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginBottom: 20 }}>
                <Button
                    loading={uploading}
                    // disabled={uploading}
                    mode='outlined'
                    style={{ flex: 0.42, borderColor: uploading ? COLOR_TEXT_BODY : COLOR_PRIMARY }}
                    textColor={uploading ? COLOR_TEXT_BODY : COLOR_PRIMARY}
                    onPress={() => !uploading ? navigation.goBack() : null}>
                    <Text>Kembali</Text>
                </Button>
                <Button
                    loading={uploading}
                    // disabled={uploading}
                    mode='contained'
                    style={{ flex: 0.42 }}
                    textColor={COLOR_WHITE_1}
                    buttonColor={uploading ? COLOR_TEXT_BODY : COLOR_PRIMARY}
                    onPress={() => !uploading ? handleSubmitUser() : null}>
                    <Text>Submit</Text>
                </Button>
            </View>
        </View>
    )
}

export default CreateUser

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: COLOR_WHITE_1,
        borderRadius: 10,
    },
    dropdown: {
        height: 40,
        borderColor: COLOR_WHITE_1,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
        marginBottom: 15,
        backgroundColor: COLOR_BG_CARD,
    },
    icon: {
        marginRight: 5,
    },
    placeholderStyle: {
        fontSize: 13,
        color: COLOR_TEXT_BODY,
    },
    selectedTextStyle: {
        fontSize: 13,
        color: COLOR_WHITE_1
    },
    inputSearchStyle: {
        height: 40,
        fontSize: 13,
        color: COLOR_WHITE_1
    },
    dropdownDate: {
        height: 40,
        width: 120,
        backgroundColor: COLOR_BG_CARD,
        borderRadius: 8,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: COLOR_PRIMARY
    }
})