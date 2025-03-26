import { SafeAreaView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import BaseScreen from '../../components/BaseScreen'
import { COLOR_WHITE_1 } from '../../utils/constant'

const ListFamilyScreen = () => {
    return (
        <BaseScreen style={{ justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: COLOR_WHITE_1 }}>TAHAP PENGEMBANGAN</Text>
        </BaseScreen>
    )
}

export default ListFamilyScreen

const styles = StyleSheet.create({})