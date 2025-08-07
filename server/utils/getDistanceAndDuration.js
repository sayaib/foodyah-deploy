// utils/getDistanceAndDuration.js
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

/**
 * @param {{ lat: number, lng: number }} origin
 * @param {{ lat: number, lng: number }} destination
 * @returns {Promise<{ distance: number, duration: number }>}
 */
export default async function getDistanceAndDuration(origin, destination) {
  if (!origin || !destination) {
    throw new Error("Origin and destination are required.");
  }

  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?access_token=${process.env.MAPBOX_PA}&geometries=geojson`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox API Error: ${response.status}`);
    }

    const data = await response.json();
    const route = data.routes?.[0];

    if (!route) {
      throw new Error("No route found from Mapbox");
    }

    return {
      distance: +(route.distance / 1000).toFixed(2), // km
      duration: +(route.duration / 60).toFixed(2), // minutes
    };
  } catch (err) {
    console.error("Mapbox API call failed:", err.message);
    throw err;
  }
}
