import { Text, View, StyleSheet } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import { formatTime } from '~/utils/datetime';
import { Position, useRunDetailStore } from '~/utils/store';

export default function Page() {
    const { serial, distance, duration, startTime, speed, positions, topic, intent } = useRunDetailStore()
    const formatedStartTime = (new Date(startTime!)).toLocaleString()
    const formatedDuration = formatTime(duration!)

    const initialRegion = positions.length === 0 ? undefined : calculateBounds(positions)
    const coords = positions.map((p) => ({ latitude: p.lat, longitude: p.long }))

    return (
        <View className='flex-1 m-10'>
            <View className='flex-1 items-center gap-y-3'>
                <Text className='text-center font-bold text-2xl py-4'>Run {serial ? '#' + serial : 'finished!'}</Text>
                <Text>Theme: {intent ? intent : ''}{topic ? ' - ' + topic : ''}</Text>
                <Text>Start: {formatedStartTime}</Text>
                <Text>Distance: {distance} m</Text>
                <Text>Duration: {formatedDuration}</Text>
                <Text>Speed: {speed} m/s</Text>
            </View>
            <Text className='text-xl font-bold mb-2'>Run Route</Text>
            <View className='flex-1 items-center'>
                {
                    initialRegion
                        ? <MapView style={StyleSheet.absoluteFill} region={initialRegion} aria-labelledby='map'>
                            <Polyline coordinates={coords} strokeColor='orange' strokeWidth={6} />
                        </MapView>
                        : <Text>No location data...</Text>
                }
            </View>
        </View>

    );
}

const MAP_PADDING_COEF = 1.2

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
