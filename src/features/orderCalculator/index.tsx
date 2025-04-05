import { ScrollView, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState, useMemo } from 'react';
import BaseScreen from '../../components/BaseScreen';
import { Dropdown, MultiSelect } from 'react-native-element-dropdown';
import {
    COLOR_BG_CARD,
    COLOR_PRIMARY,
    COLOR_TEXT_BODY,
    COLOR_WHITE_1,
} from '../../utils/constant';
import { DataDropdown, DataOrder } from '../../types';
import { supabase } from '../../config';
import { Card } from 'react-native-paper';

const OrderCalculatorScreen = () => {
    const [dataDropdownSensus, setDataDropdownSensus] = useState<DataDropdown[]>([]);
    const [dataDropdownCategory, setDataDropdownCategory] = useState<DataDropdown[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
    const [orders, setOrders] = useState<DataOrder[]>([]);
    const [totalPrice, setTotalPrice] = useState<number>(0);

    const [dataUpload, setDataUpload] = useState({
        user: { label: '', value: '', id: '' },
        category: { label: '', value: '', id: '', name: '', price: '' },
    });

    const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;

    const fetchSensusData = async () => {
        try {
            const { data, error } = await supabase
                .from('list_sensus')
                .select('uuid,name')
                .order('name', { ascending: true });

            if (error) throw error;

            const sensusOptions = data.map(item => ({
                label: item.name,
                value: item.name,
                id: item.uuid,
            }));

            setDataDropdownSensus(sensusOptions);
        } catch (err) {
            setError('Failed to fetch sensus data');
            console.error('Sensus fetch error:', err);
        }
    };

    const fetchCategoryData = async () => {
        try {
            const { data, error } = await supabase
                .from('category_order')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const categoryOptions = data.map(item => ({
                ...item,
                label: `${item.id}-${item.name}(${item.year})`,
                value: `${item.id}-${item.name}(${item.year})`,
            }));

            setDataDropdownCategory(categoryOptions);
        } catch (err) {
            setError('Failed to fetch category data');
            console.error('Category fetch error:', err);
        }
    };

    const fetchOrders = async () => {
        if (!dataUpload.user?.id || selectedCategory.length === 0) return;

        try {
            setLoading(true);
            let allOrders: DataOrder[] = [];

            for (const category of selectedCategory) {
                const categoryId = category.split('-')[0];

                const { data, error } = await supabase
                    .from('list_order')
                    .select('*')
                    .match({
                        id_category_order: categoryId,
                        user_id: dataUpload.user.id,
                    })
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Order fetch error:', error.message);
                    continue;
                }

                allOrders = [...allOrders, ...data];
            }

            const uniqueOrders = Array.from(new Map(allOrders.map(item => [item.id, item])).values());
            setOrders(uniqueOrders);

            const total = uniqueOrders.reduce((sum, order) => {
                const unitPrice = order.unit_price || 0;
                const totalOrder = order.total_order || 0;
                return sum + unitPrice * totalOrder;
            }, 0);

            setTotalPrice(total);
        } catch (err) {
            setError('Failed to fetch order data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSensusData();
        fetchCategoryData();
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [dataUpload.user?.id, selectedCategory]);

    return (
        <BaseScreen>
            <View style={{ paddingHorizontal: 20 }}>
                <Text style={styles.label}>Pilih Nama yang Memesan</Text>
                <Dropdown
                    disable={uploading}
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    containerStyle={{ backgroundColor: COLOR_BG_CARD }}
                    itemTextStyle={{ color: COLOR_WHITE_1, fontSize: 13 }}
                    activeColor={COLOR_PRIMARY}
                    data={dataDropdownSensus}
                    search
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder="Pilih Nama"
                    searchPlaceholder="Search..."
                    value={dataUpload.user.label}
                    onChange={item => {
                        setDataUpload(prev => ({
                            ...prev,
                            user: { ...item, value: item.value, label: item.value },
                        }));
                        setSelectedCategory([]);
                    }}
                />

                <Text style={styles.label}>Pilih Kategori Pesanan</Text>
                <MultiSelect
                    disable={uploading}
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    containerStyle={{ backgroundColor: COLOR_BG_CARD }}
                    itemTextStyle={{ color: COLOR_WHITE_1, fontSize: 13 }}
                    activeColor={COLOR_PRIMARY}
                    search
                    data={dataDropdownCategory}
                    labelField="label"
                    valueField="value"
                    placeholder="Pilih kategori yang ingin dihitung"
                    searchPlaceholder="Search..."
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    selectedStyle={{ backgroundColor: COLOR_PRIMARY }}
                />
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Card style={styles.card}>
                    <Text style={styles.title}>TOTAL HARGA KESELURUHAN</Text>
                    <Text style={styles.totalPrice}>{formatCurrency(totalPrice)}</Text>

                    {orders.map((order, index) => (
                        <View key={index} style={styles.orderContainer}>
                            <View style={styles.orderRow}>
                                <View style={styles.orderItem}>
                                    <Text style={styles.labelGrey}>Kategori</Text>
                                    <Text style={styles.value}>{order.name_category}</Text>
                                </View>
                                <View style={styles.orderItem}>
                                    <Text style={styles.labelGrey}>Total Pesan</Text>
                                    <Text style={styles.value}>{order.total_order} /pcs</Text>
                                </View>
                            </View>

                            <View style={styles.orderRow}>
                                <View style={styles.orderItem}>
                                    <Text style={styles.labelGrey}>Harga Satuan</Text>
                                    <Text style={styles.value}>{formatCurrency(order.unit_price)}</Text>
                                </View>
                                <View style={styles.orderItem}>
                                    <Text style={styles.labelGrey}>Total Harga</Text>
                                    <Text style={styles.value}>
                                        {formatCurrency(order.unit_price * order.total_order)}
                                    </Text>
                                </View>
                            </View>

                            {index !== orders.length - 1 && <View style={styles.divider} />}
                        </View>
                    ))}
                </Card>
            </ScrollView>
        </BaseScreen>
    );
};

export default OrderCalculatorScreen;

const styles = StyleSheet.create({
    dropdown: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 0.5,
        borderRadius: 8,
        paddingHorizontal: 8,
        marginTop: 5,
        marginBottom: 10,
    },
    label: {
        color: COLOR_WHITE_1,
    },
    placeholderStyle: {
        fontSize: 13,
        color: COLOR_TEXT_BODY,
    },
    selectedTextStyle: {
        fontSize: 13,
        color: COLOR_WHITE_1,
    },
    inputSearchStyle: {
        height: 40,
        fontSize: 13,
        color: COLOR_WHITE_1,
    },
    card: {
        borderColor: COLOR_PRIMARY,
        borderWidth: 1,
        backgroundColor: COLOR_BG_CARD,
        padding: 15,
    },
    title: {
        color: COLOR_WHITE_1,
        fontSize: 20,
    },
    totalPrice: {
        color: COLOR_PRIMARY,
        fontSize: 35,
    },
    orderContainer: {
        marginVertical: 10,
    },
    orderRow: {
        flexDirection: 'row',
    },
    orderItem: {
        flex: 0.5,
    },
    labelGrey: {
        color: 'grey',
    },
    value: {
        color: COLOR_WHITE_1,
        fontWeight: '600',
    },
    divider: {
        borderBottomWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'grey',
        marginTop: 15,
    },
});
