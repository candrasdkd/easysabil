import { Dimensions, Platform } from "react-native";

export const ios = Platform.OS === 'ios';
export const android = Platform.OS === 'android';

export const formatRupiah = (amount: string) => {
    const number = amount.replace(/\D/g, ''); // Hanya angka
    return `Rp ${number.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')}`;
};


export const windowWidth = Dimensions.get('window').width;
export const windowHeight = Dimensions.get('window').height;