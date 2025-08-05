import getDistanceAndDuration from "./getDistanceAndDuration.js";

function isValidCoords(coords) {
  return (
    Array.isArray(coords) &&
    coords.length === 2 &&
    typeof coords[0] === "number" &&
    typeof coords[1] === "number"
  );
}

/**
 * Calculates total route info for an order.
 * @param {[number, number]} deliveryCoords - [lng, lat] (optional)
 * @param {[number, number]} restaurantCoords - [lng, lat]
 * @param {[number, number]} customerCoords - [lng, lat]
 * @returns {Promise<{ distance: number, duration: number, lastRefreshed: string }>}
 */
export default async function calculateRouteInfo(
  deliveryCoords,
  restaurantCoords,
  customerCoords
) {
  let totalDistance = 0;
  let totalDuration = 0;

  try {
    if (isValidCoords(deliveryCoords)) {
      const fromDeliveryToRestaurant = await getDistanceAndDuration(
        { lat: deliveryCoords[1], lng: deliveryCoords[0] },
        { lat: restaurantCoords[1], lng: restaurantCoords[0] }
      );
      totalDistance += fromDeliveryToRestaurant.distance;
      totalDuration += fromDeliveryToRestaurant.duration;
    }

    const fromRestaurantToCustomer = await getDistanceAndDuration(
      { lat: restaurantCoords[1], lng: restaurantCoords[0] },
      { lat: customerCoords[1], lng: customerCoords[0] }
    );
    totalDistance += fromRestaurantToCustomer.distance;
    totalDuration += fromRestaurantToCustomer.duration;

    return {
      distance: +totalDistance.toFixed(2),
      duration: +totalDuration.toFixed(2),
      lastRefreshed: new Date().toISOString(),
    };
  } catch (err) {
    console.error("Route calculation error:", err.message);
    throw new Error("Failed to calculate route info.");
  }
}
