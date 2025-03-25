import { StyleSheet, Text } from 'react-native'
import React from 'react'
import { Card, Title } from 'react-native-paper'
import { COLOR_BG_CARD, COLOR_PRIMARY, COLOR_TEXT_BODY } from '../../../utils/constant';

interface CardProps {
    title: string;
    count: number;
}

const CardComponent: React.FC<CardProps> = ({ title, count }) => {
    return (
        <Card style={styles.card}>
            <Card.Content>
                <Title style={styles.title}>{title}</Title>
                <Text style={styles.total}>{count}</Text>
            </Card.Content>
        </Card>
    )
}

export default CardComponent

const styles = StyleSheet.create({
    total: {
        color: COLOR_PRIMARY,
        fontSize: 40,
        textAlign: 'center'
    },
    card: {
        flex: 1,
        marginHorizontal: 8,
        backgroundColor: COLOR_BG_CARD, // Background card dark
        alignItems: 'center'
    },
    title: {
        color: COLOR_TEXT_BODY, // Judul card
    },
})