import { SafeAreaView, StyleSheet, ViewStyle } from 'react-native'
import React, { ReactNode } from 'react'
import { COLOR_BG_CARD } from '../utils/constant'

const BaseScreen = ({ children, style }: { children: ReactNode; style?: ViewStyle }) => {
    return (
        <SafeAreaView style={[styles.container, style]}>
            {children}
        </SafeAreaView>
    )
}

export default BaseScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLOR_BG_CARD,
        paddingTop: 15,
    },
})