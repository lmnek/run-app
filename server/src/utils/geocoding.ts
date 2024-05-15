import fetch from "node-fetch";
import { logger } from "./logger";

// Fetch the location display name 
// only from the GPS location
// -> using the OpenStreetMap API

const zoom = 17 // minor street level
const format = "jsonv2"

export default async function reverseGeocode(lat: number, long: number) {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=${format}&lat=${lat}&lon=${long}&zoom=${zoom}&layer=address,poi,natural,manmade`,
            {
                headers: {
                    "Accept-Language": "en-US",
                },
            },
        )
        const { type, display_name } = await res.json()
        return { type, display_name }
    } catch (err) {
        logger.warn('Geocoding error', { err })
        return undefined;
    }
}

