import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Card, Title } from 'react-native-paper'
import { COLOR_BG_CARD, COLOR_PRIMARY, COLOR_TEXT_BODY } from '../../../utils/constant';

interface CardProps {
    title: string;
    count: number;
    loading: boolean;
    totalWomen?: number;
    totalMen?: number;
}

const CardComponent: React.FC<CardProps> = ({ title, count, loading, totalMen, totalWomen }) => {
    return (
        <Card style={styles.card}>
            <Card.Content>
                <Title style={styles.title}>{title}</Title>
                {loading ?
                    <ActivityIndicator size={'large'} color={COLOR_PRIMARY} /> :
                    <Text style={styles.total}>{count}</Text>
                }
                {totalMen && totalWomen ?
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%' }}>
                        <View style={{ flexDirection: 'row', alignItems:'center' }}>
                            <Title style={styles.subTitle}>L : </Title>
                            {loading ?
                                <ActivityIndicator size={'large'} color={COLOR_PRIMARY} /> :
                                <Text style={styles.subTotalMen}>{totalMen}</Text>
                            }
                        </View>
                        <View style={{ flexDirection: 'row', alignItems:'center' }}>
                            <Title style={styles.subTitle}>P : </Title>
                            {loading ?
                                <ActivityIndicator size={'large'} color={COLOR_PRIMARY} /> :
                                <Text style={styles.subTotalWomen}>{totalWomen}</Text>
                            }
                        </View>
                    </View> : null
                }
            </Card.Content>
        </Card>
    )
}

export default CardComponent

const styles = StyleSheet.create({
    card: {
        flex: 1,
        marginHorizontal: 8,
        backgroundColor: COLOR_BG_CARD, // Background card dark
        alignItems: 'center'
    },
    total: {
        color: COLOR_PRIMARY,
        fontSize: 40,
        textAlign: 'center'
    },
    subTotalWomen: {
        color: '#FFB8E0',
        fontSize: 20,
        textAlign: 'center'
    },
    subTotalMen: {
        color: '#4D55CC',
        fontSize: 20,
        textAlign: 'center'
    },

    title: {
        textAlign: 'center',
        color: COLOR_TEXT_BODY, // Judul card
    },
    subTitle: {
        color: COLOR_TEXT_BODY, // Judul card
        fontSize: 20
    },
})