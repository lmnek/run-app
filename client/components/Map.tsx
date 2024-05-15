
import { StyleSheet } from 'react-native';
import React from 'react'
import MapView, { Polyline } from 'react-native-maps'
import { Position } from '~/utils/stores/runStore'
import { Text } from './ui/text'
import { PRIMARY_RGB } from '~/lib/constants';

const MAP_PADDING_COEF = 1.2

// Component to display the map with the running route
// For now uses google maps on Android and Apple maps on iOS
export default function Map({ positions }: { positions: Position[] | undefined }) {
    if (!positions) {
        return <Text className='italic'>Loading the map...</Text>
    }
    if (positions.length === 0) {
        return <Text className='italic'>No route location data available.</Text>
    }

    const initialRegion = calculateBounds(positions)
    const coords = positions.map((p) => ({ latitude: p.lat, longitude: p.long }))
    return (
        <MapView style={StyleSheet.absoluteFill} region={initialRegion} aria-labelledby='map'>
            <Polyline coordinates={coords} strokeColor={PRIMARY_RGB} strokeWidth={7} />
        </MapView>
    )
}

// Calculate bounds so that the map is centered 
// around the whole router
const calculateBounds = (positions: Position[]) => {
    let { lat: minLat, long: minLng } = positions[0]
    let maxLat = minLat
    let maxLng = minLng

    positions.forEach(point => {
        minLat = Math.min(minLat, point.lat)
        maxLat = Math.max(maxLat, point.lat)
        minLng = Math.min(minLng, point.long)
        maxLng = Math.max(maxLng, point.long)
    })

    return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: (maxLat - minLat) * MAP_PADDING_COEF,
        longitudeDelta: (maxLng - minLng) * MAP_PADDING_COEF
    }
}
