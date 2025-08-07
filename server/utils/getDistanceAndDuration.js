// utils/getDistanceAndDuration.js
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const MAPBOX_PA = process.env.MAPBOX_PA;

// Debug: Log token presence (don't log full token in production)
if (!MAPBOX_PA) {
  console.error(
    "🚨 MAPBOX_PA token is missing. Make sure it's set in environment variables."
  );
  throw new Error("MAPBOX_PA is not defined.");
}

/**
 * @param {{ lat: number, lng: number }} origin
 * @param {{ lat: number, lng: number }} destination
 * @returns {Promise<{ distance: number, duration: number }>}
 */
export default async function getDistanceAndDuration(origin, destination) {
  if (!origin || !destination) {
    throw new Error("🚨 Origin and destination are required.");
  }

  const { lat: originLat, lng: originLng } = origin;
  const { lat: destLat, lng: destLng } = destination;

  // Debug coordinates
  console.log("🔍 Origin:", origin);
  console.log("🔍 Destination:", destination);

  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${originLng},${originLat};${destLng},${destLat}?access_token=${MAPBOX_PA}&geometries=geojson`;

  try {
    const response = await fetch(url);

    // Debug HTTP response
    console.log("📡 Mapbox API URL:", url);
    console.log("📡 Mapbox status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Mapbox API Error Response:", errorText);
      throw new Error(`Mapbox API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.routes || !data.routes[0]) {
      console.error(
        "❌ No route found in Mapbox response:",
        JSON.stringify(data, null, 2)
      );
      throw new Error("No route found from Mapbox");
    }

    const route = data.routes[0];

    const distanceKm = +(route.distance / 1000).toFixed(2); // km
    const durationMin = +(route.duration / 60).toFixed(2); // minutes

    // Debug result
    console.log(`✅ Distance: ${distanceKm} km | Duration: ${durationMin} min`);

    return {
      distance: distanceKm,
      duration: durationMin,
    };
  } catch (err) {
    console.error("🔥 Mapbox API call failed:", err);
    throw err;
  }
}
