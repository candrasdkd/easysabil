import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Dropdown } from 'react-native-element-dropdown';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { DataFamily, DataSensus } from '../../types';
import { COLOR_BG_CARD, COLOR_PRIMARY, COLOR_TEXT_BODY, COLOR_WHITE_1 } from '../../utils/constant';
import { Button, } from 'react-native-paper';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { supabase } from '../../config';
import { ios } from '../../utils/helper';

type UpdateUserRouteParams = {
    detailUser: DataSensus;
    dataFamily: DataFamily[]; // Adjust this type based on your actual DataFamily type
};
const UpdateUser = () => {
    const route = useRoute<RouteProp<{ params: UpdateUserRouteParams }>>();
    const { detailUser, dataFamily } = route.params;
    const navigation = useNavigation();

    const [showCalendar, setShowCalendar] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [bodyUser, setBodyUser] = useState({
        fullname: detailUser.name,
        dob: detailUser.date_of_birth ? detailUser.date_of_birth : '',
        gender: { label: detailUser.gender, value: detailUser.gender },
        grade: { label: detailUser.level, value: detailUser.level },
        family: { label: detailUser.family_name, value: detailUser.family_name, id: detailUser.id_family },
        marriage: { label: detailUser.marriage_status, value: detailUser.marriage_status },
    });

    const handleUpdateUser = async (id: string) => {
        try {
            setUploading(true);

            const birthDate = new Date(bodyUser.dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
                age--;
            }

            const transformBody = {
                name: bodyUser.fullname,
                date_of_birth: bodyUser.dob,
                gender: bodyUser.gender.value,
                level: bodyUser.grade.value,
                age: `${age} Tahun`,
                marriage_status: bodyUser.marriage.value,
                id_family: bodyUser.family.id,
                family_name: bodyUser.family.label,
            };

            const { error } = await supabase.from('sensus').update(transformBody).eq('uuid', id);
            if (error) throw error;

            Alert.alert('Berhasil', 'Data berhasil diedit');
            navigation.goBack();
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setUploading(false);
        }
    };

    LocaleConfig.locales['id'] = {
        monthNames: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
        monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
        dayNames: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
        dayNamesShort: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
        today: 'Hari ini',
    };
    LocaleConfig.defaultLocale = 'id';

    return (
        <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: ios ? 20 : 0, paddingTop: 20 }}>
                <Text style={{ color: COLOR_WHITE_1 }}>Dari Keluarga</Text>
                <Dropdown
                    disable={uploading}
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
                    value={bodyUser.family.label ? bodyUser.family.label : { label: detailUser.family_name, value: detailUser.family_name, id: detailUser.id_family }}
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
                    defaultValue={detailUser ? detailUser.name : bodyUser?.fullname}
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
                    <Text style={{ color: bodyUser.dob || detailUser.date_of_birth ? COLOR_WHITE_1 : COLOR_TEXT_BODY, fontSize: 13 }}>
                        {bodyUser?.dob || detailUser.date_of_birth ?
                            new Date(bodyUser.dob || detailUser.date_of_birth).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })
                            : 'Pilih Tanggal Lahir'
                        }
                    </Text>
                </TouchableOpacity>
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
                    value={bodyUser.gender.label ? bodyUser.gender.label : detailUser.gender}
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
                    value={bodyUser.grade.label ? bodyUser.grade.label : detailUser.level}
                    onChange={item => {
                        setBodyUser({
                            ...bodyUser,
                            grade: item
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
                    value={bodyUser.marriage.label ? bodyUser.marriage.label : detailUser.marriage_status}
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
                visible={showCalendar}
                onRequestClose={() => setShowCalendar(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Calendar
                            initialDate={bodyUser?.dob?.toString()}
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
                                            placeholder={LocaleConfig.locales['id'].monthNames[new Date(detailUser?.date_of_birth).getMonth()]}
                                            value={month || new Date(detailUser?.date_of_birth).getMonth()}
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
                                            value={year}
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
                                [bodyUser.dob.toString()]: { selected: true, disableTouchEvent: true }
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
                    buttonColor={uploading ? COLOR_TEXT_BODY : COLOR_PRIMARY}
                    onPress={() => !uploading ? handleUpdateUser(detailUser.uuid) : null}>
                    <Text>Update</Text>
                </Button>
            </View>
        </View>
    )
}

export default UpdateUser

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
        marginTop: 5,
        marginBottom: 15,
        backgroundColor: COLOR_BG_CARD,
    },
    icon: {
        marginRight: 5,
    },
    placeholderStyle: {
        fontSize: 13,
        color: COLOR_WHITE_1,
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