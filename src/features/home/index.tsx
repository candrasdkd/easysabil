import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, Text, StatusBar, TouchableOpacity, Alert, Platform, Linking } from 'react-native';
import { supabase } from '../../config';
import CardComponent from '../../components/Card';
import { ios } from '../../utils/helper';
import { useNavigation } from '@react-navigation/native';
import Monicon from '@monicon/native';
import { COLOR_PRIMARY, COLOR_WHITE_1 } from '../../utils/constant';
import * as Clipboard from '@react-native-clipboard/clipboard';

const HomeScreen = () => {
  const navigation = useNavigation()
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<{
    totalUsers: number;
    totalAdult: number;
    totalAdultWomen: number;
    totalAdultMen: number;
    totalPraNikah: number;
    totalPraNikahWomen: number;
    totalPraNikahMen: number;
    totalRemaja: number;
    totalRemajaWomen: number;
    totalRemajaMen: number;
    totalPraRemaja: number;
    totalPraRemajaWomen: number;
    totalPraRemajaMen: number;
    totalCabeRawit: number;
    totalCabeRawitWomen: number;
    totalCabeRawitMen: number;
    totalBalita: number;
    totalBalitaWomen: number;
    totalBalitaMen: number;
    totalMen: number;
    totalWomen: number;
    totalMarriage: number;
    totalWidower: number;
    totalWidow: number;
  }>({
    totalUsers: 0,
    totalAdult: 0,
    totalAdultWomen: 0,
    totalAdultMen: 0,
    totalPraNikah: 0,
    totalPraNikahWomen: 0,
    totalPraNikahMen: 0,
    totalRemaja: 0,
    totalRemajaWomen: 0,
    totalRemajaMen: 0,
    totalPraRemaja: 0,
    totalPraRemajaWomen: 0,
    totalPraRemajaMen: 0,
    totalCabeRawit: 0,
    totalCabeRawitWomen: 0,
    totalCabeRawitMen: 0,
    totalBalita: 0,
    totalBalitaWomen: 0,
    totalBalitaMen: 0,
    totalMen: 0,
    totalWomen: 0,
    totalMarriage: 0,
    totalWidower: 0,
    totalWidow: 0,
  })

  const copyHeader = async () => {
    const headerString = `
📊 STATISTIK SENSUS KELOMPOK 1 📊

👥 Total Anggota: ${count.totalUsers} orang

🏷️ Berdasarkan Kategori:
━━━━━━━━━━━━━━━━━━━━━
📌 Dewasa: ${count.totalAdult} orang
   • Laki-laki: ${count.totalAdultMen}
   • Perempuan: ${count.totalAdultWomen}

📌 Pra Nikah: ${count.totalPraNikah} orang
   • Laki-laki: ${count.totalPraNikahMen}
   • Perempuan: ${count.totalPraNikahWomen}

📌 Remaja: ${count.totalRemaja} orang
   • Laki-laki: ${count.totalRemajaMen}
   • Perempuan: ${count.totalRemajaWomen}

📌 Pra Remaja: ${count.totalPraRemaja} orang
   • Laki-laki: ${count.totalPraRemajaMen}
   • Perempuan: ${count.totalPraRemajaWomen}

📌 Cabe Rawit: ${count.totalCabeRawit} orang
   • Laki-laki: ${count.totalCabeRawitMen}
   • Perempuan: ${count.totalCabeRawitWomen}

📌 Balita: ${count.totalBalita} orang
   • Laki-laki: ${count.totalBalitaMen}
   • Perempuan: ${count.totalBalitaWomen}

👤 Total Berdasarkan Gender:
━━━━━━━━━━━━━━━━━━━━━
👨 Laki-laki: ${count.totalMen} orang
👩 Perempuan: ${count.totalWomen} orang

💑 Status Pernikahan:
━━━━━━━━━━━━━━━━━━━━━
👫 Menikah: ${count.totalMarriage} orang
👨 Duda: ${count.totalWidower} orang
👩 Janda: ${count.totalWidow} orang
`;
    Clipboard.default.setString(headerString);
    Alert.alert(
      'Berhasil',
      'Data berhasil disalin ke clipboard',
      [
        {
          text: 'Pergi Ke Whatsapp',
          onPress: () => {
            // Encode the text for URL
            const encodedText = encodeURIComponent(headerString);

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
  }


  useEffect(() => {
    const fetchSensus = async () => {
      try {
        const { data, error } = await supabase
          .from('sensus')
          .select('uuid, gender, level, marriage_status')
          .eq('is_active', true);

        if (error) {
          setError(error.message);
          console.error('Error:', error.message);
          return;
        }
        // Count data by level
        if (data) {
          const counts = {
            totalUsers: data.length,
            totalAdult: data.filter(item => item.level === 'Dewasa').length,
            totalAdultWomen: data.filter(item => item.level === 'Dewasa' && item.gender === 'Perempuan').length,
            totalAdultMen: data.filter(item => item.level === 'Dewasa' && item.gender === 'Laki - Laki').length,
            totalPraNikah: data.filter(item => item.level === 'Pra Nikah').length,
            totalPraNikahWomen: data.filter(item => item.level === 'Pra Nikah' && item.gender === 'Perempuan').length,
            totalPraNikahMen: data.filter(item => item.level === 'Pra Nikah' && item.gender === 'Laki - Laki').length,
            totalRemaja: data.filter(item => item.level === 'Remaja').length,
            totalRemajaWomen: data.filter(item => item.level === 'Remaja' && item.gender === 'Perempuan').length,
            totalRemajaMen: data.filter(item => item.level === 'Remaja' && item.gender === 'Laki - Laki').length,
            totalPraRemaja: data.filter(item => item.level === 'Pra Remaja').length,
            totalPraRemajaWomen: data.filter(item => item.level === 'Pra Remaja' && item.gender === 'Perempuan').length,
            totalPraRemajaMen: data.filter(item => item.level === 'Pra Remaja' && item.gender === 'Laki - Laki').length,
            totalCabeRawit: data.filter(item => item.level === 'Cabe Rawit').length,
            totalCabeRawitWomen: data.filter(item => item.level === 'Cabe Rawit' && item.gender === 'Perempuan').length,
            totalCabeRawitMen: data.filter(item => item.level === 'Cabe Rawit' && item.gender === 'Laki - Laki').length,
            totalBalita: data.filter(item => item.level === 'Balita').length,
            totalBalitaWomen: data.filter(item => item.level === 'Balita' && item.gender === 'Perempuan').length,
            totalBalitaMen: data.filter(item => item.level === 'Balita' && item.gender === 'Laki - Laki').length,
            totalMen: data.filter(item => item.gender === 'Laki - Laki').length,
            totalWomen: data.filter(item => item.gender === 'Perempuan').length,
            totalMarriage: data.filter(item => item.marriage_status === 'Menikah').length,
            totalWidower: data.filter(item => item.marriage_status === 'Duda').length,
            totalWidow: data.filter(item => item.marriage_status === 'Janda').length,
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
  }, [navigation]);

  // console.log('sensus', sensus);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor={'transparent'} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <CardComponent
            title='TOTAL SENSUS KELOMPOK 1'
            count={count.totalUsers}
            loading={loading}
          />
        </View>
        {/* SECTION 1 */}
        <View style={styles.row}>
          <CardComponent
            title='Dewasa'
            count={count.totalAdult}
            loading={loading}
            totalMen={count.totalAdultMen}
            totalWomen={count.totalAdultWomen}
          />
          <CardComponent
            title='Pra Nikah'
            count={count.totalPraNikah}
            loading={loading}
            totalMen={count.totalPraNikahMen}
            totalWomen={count.totalPraNikahWomen}
          />
        </View>
        {/* SECTION 2 */}
        <View style={styles.row}>
          <CardComponent
            title='Remaja'
            count={count.totalRemaja}
            loading={loading}
            totalMen={count.totalRemajaMen}
            totalWomen={count.totalRemajaWomen}
          />
          <CardComponent
            title='Pra Remaja'
            count={count.totalPraRemaja}
            loading={loading}
            totalMen={count.totalPraRemajaMen}
            totalWomen={count.totalPraRemajaWomen}
          />
        </View>
        {/* SECTION 3 */}
        <View style={styles.row}>
          <CardComponent
            title='Cabe Rawit'
            count={count.totalCabeRawit}
            loading={loading}
            totalMen={count.totalCabeRawitMen}
            totalWomen={count.totalCabeRawitWomen}
          />
          <CardComponent
            title='Balita'
            count={count.totalBalita}
            loading={loading}
            totalMen={count.totalBalitaMen}
            totalWomen={count.totalBalitaWomen}
          />
        </View>
        {/* SECTION 4 */}
        <View style={styles.row}>
          <CardComponent
            title='Laki - Laki'
            count={count.totalMen}
            loading={loading}
          />
          <CardComponent
            title='Perempuan'
            count={count.totalWomen}
            loading={loading}
          />
        </View>
        {/* SECTION 5 */}
        <View style={styles.row}>
          <CardComponent
            title='Duda'
            count={count.totalWidower}
            loading={loading}
          />
          <CardComponent
            title='Janda'
            count={count.totalWidow}
            loading={loading}
          />
        </View>
      </ScrollView>
      <TouchableOpacity style={styles.addButton} onPress={copyHeader}>
        <Monicon name="material-symbols:content-copy" size={30} color={COLOR_WHITE_1} />
      </TouchableOpacity>
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
    paddingTop: 20,
    paddingBottom:100
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
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
});
