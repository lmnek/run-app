import fetch from "node-fetch";
import { logger } from "./logger.js";

// Fetch the weather data for the given GPS location
// -> using the OpenMeteo API

// Weather data that will be returned for the current moment
const propertiesStr = "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,wind_speed_10m"
const properties = propertiesStr.split(",")

export default async function getWeatherStr(lat: number, long: number) {
    try {
        const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&current=${propertiesStr}`
        )
        const data = await res.json()
        // Compress the JSON response to easily readable string
        const resStr = properties.reduce((acc, property) => (
            acc +
            property +
            ": " +
            data["current"][property] +
            data["current_units"][property] +
            "; "
        ), "")
        return resStr
    } catch (err) {
        logger.warn('Weather error', { err })
        return ''
    }
}


