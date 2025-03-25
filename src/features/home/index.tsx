import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, Text, StatusBar } from 'react-native';
import { supabase } from '../../config';
import CardComponent from './component/card';
import { ios } from '../../utils/helper';

const HomeScreen = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<{
    totalUsers: number,
    totalDewasa: number,
    totalPraNikah: number,
    totalRemaja: number,
    totalPraRemaja: number,
    totalCabeRawit: number,
    totalBalita: number,
    totalMen: number,
    totalWomen: number,
    totalMarriage: number,
  }>({
    totalUsers: 0,
    totalDewasa: 0,
    totalPraNikah: 0,
    totalRemaja: 0,
    totalPraRemaja: 0,
    totalCabeRawit: 0,
    totalBalita: 0,
    totalMen: 0,
    totalWomen: 0,
    totalMarriage: 0,
  })

  useEffect(() => {
    const fetchSensus = async () => {
      try {
        const { data, error } = await supabase
          .from('sensus')
          .select('uuid, gender, level, marriage_status')

        if (error) {
          setError(error.message);
          console.error('Error:', error.message);
          return;
        }
        // Count data by level
        if (data) {
          const counts = {
            totalUsers: data.length,
            totalDewasa: data.filter(item => item.level === 'Dewasa').length,
            totalPraNikah: data.filter(item => item.level === 'Pra Nikah').length,
            totalRemaja: data.filter(item => item.level === 'Remaja').length,
            totalPraRemaja: data.filter(item => item.level === 'Pra Remaja').length,
            totalCabeRawit: data.filter(item => item.level === 'Cabe Rawit').length,
            totalBalita: data.filter(item => item.level === 'Balita').length,
            totalMen: data.filter(item => item.gender === 'Laki - Laki').length,
            totalWomen: data.filter(item => item.gender === 'Perempuan').length,
            totalMarriage: data.filter(item => item.marriage_status === 'Menikah').length,
          };
          setCount(counts);
        }
      } catch (e) {
        console.error('Fetch error:', e);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchSensus();
  }, []);

  // console.log('sensus', sensus);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor={'transparent'} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <CardComponent
            title='TOTAL SENSUS KELOMPOK 1'
            count={count.totalUsers}
          />
        </View>
        {/* SECTION 1 */}
        <View style={styles.row}>
          <CardComponent
            title='Dewasa'
            count={count.totalDewasa}
          />
          <CardComponent
            title='Pra Nikah'
            count={count.totalPraNikah}
          />
        </View>
        {/* SECTION 2 */}
        <View style={styles.row}>
          <CardComponent
            title='Remaja'
            count={count.totalRemaja}
          />
          <CardComponent
            title='Pra Remaja'
            count={count.totalPraRemaja}
          />
        </View>
        {/* SECTION 3 */}
        <View style={styles.row}>
          <CardComponent
            title='Cabe Rawit'
            count={count.totalCabeRawit}
          />
          <CardComponent
            title='Balita'
            count={count.totalBalita}
          />
        </View>
        {/* SECTION 4 */}
        <View style={styles.row}>
          <CardComponent
            title='Laki - Laki'
            count={count.totalMen}
          />
          <CardComponent
            title='Perempuan'
            count={count.totalWomen}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default HomeScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Warna background dark
    paddingTop: 15
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
});
