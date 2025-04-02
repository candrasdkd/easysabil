import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, Text, StatusBar, TouchableOpacity, Alert, Platform, Linking, Animated } from 'react-native';
import { supabase } from '../../config';
import CardComponent from '../../components/Card';
import { ios } from '../../utils/helper';
import { useNavigation } from '@react-navigation/native';
import Monicon from '@monicon/native';
import { COLOR_PRIMARY, COLOR_WHITE_1 } from '../../utils/constant';
import * as Clipboard from '@react-native-clipboard/clipboard';
import XLSX from 'xlsx';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

const dataToExport = [
  { nama: 'Budi', usia: 25 },
  { nama: 'Siti', usia: 30 },
];
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
  const [open, setOpen] = useState(false);
  const animation = useState(new Animated.Value(0))[0];

  const toggleMenu = () => {
    Animated.timing(animation, {
      toValue: open ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setOpen(!open);
  };

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

  const exportToExcel = async () => {
    try {
      // 1. Generate dynamic filename with timestamp
      const date = new Date();
      const timestamp = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}_${date
          .getHours()
          .toString()
          .padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}`;

      const fileName = `Data_Anggota_${timestamp}.xlsx`;

      // 2. Prepare data with additional metadata
      const excelData = [
        { Kategori: '📊 STATISTIK SENSUS KELOMPOK 1', Jumlah: '', 'Laki-laki': '', 'Perempuan': '' },
        { Kategori: '👥 Total Anggota', Jumlah: `${count.totalUsers} orang`, 'Laki-laki': `${count.totalMen} orang`, 'Perempuan': `${count.totalWomen} orang` },
        { Kategori: '', Jumlah: '', 'Laki-laki': '', 'Perempuan': '' },
        { Kategori: '🏷️ Berdasarkan Kategori:', Jumlah: '', 'Laki-laki': '', 'Perempuan': '' },
        { Kategori: '📌 Dewasa', Jumlah: `${count.totalAdult} orang`, 'Laki-laki': `${count.totalAdultMen} orang`, 'Perempuan': `${count.totalAdultWomen} orang` },
        { Kategori: '📌 Pra Nikah', Jumlah: `${count.totalPraNikah} orang`, 'Laki-laki': `${count.totalPraNikahMen} orang`, 'Perempuan': `${count.totalPraNikahWomen} orang` },
        { Kategori: '📌 Remaja', Jumlah: `${count.totalRemaja} orang`, 'Laki-laki': `${count.totalRemajaMen} orang`, 'Perempuan': `${count.totalRemajaWomen} orang` },
        { Kategori: '📌 Pra Remaja', Jumlah: `${count.totalPraRemaja} orang`, 'Laki-laki': `${count.totalPraRemajaMen} orang`, 'Perempuan': `${count.totalPraRemajaWomen} orang` },
        { Kategori: '📌 Cabe Rawit', Jumlah: `${count.totalCabeRawit} orang`, 'Laki-laki': `${count.totalCabeRawitMen} orang`, 'Perempuan': `${count.totalCabeRawitWomen} orang` },
        { Kategori: '📌 Balita', Jumlah: `${count.totalBalita} orang`, 'Laki-laki': `${count.totalBalitaMen} orang`, 'Perempuan': `${count.totalBalitaWomen} orang` },
        { Kategori: '', Jumlah: '', 'Laki-laki': '', 'Perempuan': '' },
        { Kategori: '💑 Status Pernikahan:', Jumlah: '', 'Laki-laki': '', 'Perempuan': '' },
        { Kategori: '👫 Menikah', Jumlah: `${count.totalMarriage} orang`, 'Laki-laki': '-', 'Perempuan': '-' },
        { Kategori: '👨 Duda', Jumlah: `${count.totalWidower} orang`, 'Laki-laki': '-', 'Perempuan': '-' },
        { Kategori: '👩 Janda', Jumlah: `${count.totalWidow} orang`, 'Laki-laki': '-', 'Perempuan': '-' },
      ];

      // 3. Create worksheet with custom styling
      const ws = XLSX.utils.json_to_sheet(excelData);
      ws['!cols'] = [
        { width: 30 }, // Kategori column width
        { width: 20 }, // Jumlah column width
        { width: 20 }, // Laki-laki column width
        { width: 20 }, // Perempuan column width
      ];

      // 4. Create workbook and append sheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Statistik Anggota");

      // 5. Generate file in base64 format
      const wbout = XLSX.write(wb, {
        type: 'base64',
        bookType: 'xlsx',
        bookSST: false,
      });

      // 6. Platform-specific file path handling
      let filePath = '';
      if (Platform.OS === 'android') {
        filePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      } else {
        filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      }

      // 7. Write file with error handling
      await RNFS.writeFile(filePath, wbout, 'base64');

      // 8. Verify file existence
      const fileExists = await RNFS.exists(filePath);
      if (!fileExists) {
        throw new Error('File export failed');
      }

      // 9. Platform-specific sharing options
      const shareOptions = {
        url: `file://${filePath}`,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        subject: `Data Anggota ${timestamp}`, // Email subject
        failOnCancel: false,
        saveToFiles: true, // iOS specific: save to Files app
      };

      // 10. Open share dialog
      await Share.open(shareOptions);

    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        'Export Gagal',
        'Terjadi kesalahan saat mengekspor data. Silakan coba lagi.',
        [{ text: 'OK', style: 'cancel' }]
      );
    }
  };



  useEffect(() => {
    const fetchSensus = async () => {
      try {
        const { data, error } = await supabase
          .from('list_sensus')
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
      {open && (
        <>
          <Animated.View style={[styles.fabButtonContainer, { bottom: 160 }]}>
            <Text style={styles.fabLabel}>Export Excel</Text>
            <TouchableOpacity style={styles.fabButton} onPress={exportToExcel}>
              <Monicon name="vscode-icons:file-type-excel" size={30} color={COLOR_WHITE_1} />
            </TouchableOpacity>
          </Animated.View>
          <Animated.View style={[styles.fabButtonContainer, { bottom: 95 }]}>
            <Text style={styles.fabLabel}>Copy Header</Text>
            <TouchableOpacity style={styles.fabButton} onPress={copyHeader}>
              <Monicon name="material-symbols:content-copy" size={30} color={COLOR_WHITE_1} />
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
      <TouchableOpacity style={styles.fabMainButton} onPress={toggleMenu}>
        <Monicon name={open ? "material-symbols:close" : "mdi-light:settings"} size={30} color={COLOR_WHITE_1} />
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
    paddingBottom: 100
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    alignItems: 'flex-end',
  },
  fabButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 20,
  },
  fabButton: {
    width: 50,
    height: 50,
    borderRadius: 50,
    backgroundColor: COLOR_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabMainButton: {
    position: 'absolute',
    bottom: 20,
    right: 15,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLOR_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabLabel: {
    marginRight: 10,
    color: COLOR_WHITE_1,
    fontSize: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
  }
});
