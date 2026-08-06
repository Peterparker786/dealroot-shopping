import { INDIAN_STATES, CITIES_BY_STATE } from "./indianAddressData";

// Normalise an Indian state name from a geocoder so it matches the labels in
// INDIAN_STATES ("Uttar Pradesh" → "Uttar Pradesh", "Delhi" → "Delhi", etc).
const STATE_ALIASES = {
  "andaman and nicobar": "Andaman and Nicobar Islands",
  "andhra pradesh": "Andhra Pradesh",
  "arunachal pradesh": "Arunachal Pradesh",
  assam: "Assam",
  bihar: "Bihar",
  chandigarh: "Chandigarh",
  chhattisgarh: "Chhattisgarh",
  "dadra and nagar haveli": "Dadra and Nagar Haveli and Daman and Diu",
  delhi: "Delhi",
  "national capital territory of delhi": "Delhi",
  "nct of delhi": "Delhi",
  goa: "Goa",
  gujarat: "Gujarat",
  haryana: "Haryana",
  "himachal pradesh": "Himachal Pradesh",
  "jammu and kashmir": "Jammu and Kashmir",
  jharkhand: "Jharkhand",
  karnataka: "Karnataka",
  kerala: "Kerala",
  ladakh: "Ladakh",
  lakshadweep: "Lakshadweep",
  "madhya pradesh": "Madhya Pradesh",
  maharashtra: "Maharashtra",
  manipur: "Manipur",
  meghalaya: "Meghalaya",
  mizoram: "Mizoram",
  nagaland: "Nagaland",
  odisha: "Odisha",
  orissa: "Odisha",
  puducherry: "Puducherry",
  punjab: "Punjab",
  rajasthan: "Rajasthan",
  sikkim: "Sikkim",
  "tamil nadu": "Tamil Nadu",
  "tamilnadu": "Tamil Nadu",
  telangana: "Telangana",
  tripura: "Tripura",
  "uttar pradesh": "Uttar Pradesh",
  uttarakhand: "Uttarakhand",
  "west bengal": "West Bengal",
};

// Resolve a raw geocoder state string to a canonical INDIAN_STATES entry.
export const resolveIndianState = (rawState = "") => {
  const key = String(rawState).trim().toLowerCase();
  if (!key) return null;

  const label = STATE_ALIASES[key] || null;
  if (!label) return null;

  return INDIAN_STATES.find((state) => state.label === label) || null;
};

// Geocode city names may come back slightly different (e.g. "Bengaluru").
// Return a known city for the state when an obvious match exists, otherwise
// pass the raw city through so checkout still works.
export const resolveIndianCity = (stateEntry, rawCity = "") => {
  const name = String(rawCity).trim();
  if (!name) return "";

  const cityList = stateEntry ? CITIES_BY_STATE[stateEntry.value] || [] : [];
  const match = cityList.find(
    (city) => city.toLowerCase() === name.toLowerCase()
  );
  if (match) return match;

  // "Bengaluru" vs "Bengaluru" already covered; tolerate common suffix
  // mismatches like "New Delhi" → "Delhi" stays as typed.
  return name;
};

// Best-effort reverse geocoding. Tries BigDataCloud first (free, no key,
// locality-aware) and falls back to OpenStreetMap Nominatim.
const bigDataCloudReverseGeocode = async (latitude, longitude) => {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    localityLanguage: "en",
  });

  const response = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`,
    { signal: AbortSignal.timeout(8000) }
  );
  if (!response.ok) throw new Error("Geocoder unavailable");

  const data = await response.json();
  const state = resolveIndianState(data.principalSubdivision);
  const city = resolveIndianCity(state, data.city || data.locality || data.localityInfo);

  return { state, city };
};

const nominatimReverseGeocode = async (latitude, longitude) => {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    addressdetails: "1",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params}`,
    {
      headers: { "Accept-Language": "en" },
      signal: AbortSignal.timeout(8000),
    }
  );
  if (!response.ok) throw new Error("Geocoder unavailable");

  const data = await response.json();
  const state = resolveIndianState(
    data.address?.state || data.address?.region || ""
  );
  const city = resolveIndianCity(
    state,
    data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.county ||
      ""
  );

  return { state, city };
};

export const reverseGeocode = async (latitude, longitude) => {
  try {
    return await bigDataCloudReverseGeocode(latitude, longitude);
  } catch {
    return nominatimReverseGeocode(latitude, longitude);
  }
};

// Promise wrapper around the browser geolocation API so callers can await it.
export const getCurrentPosition = (options) =>
  new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
      ...options,
    });
  });

// Human readable error for a geolocation failure.
export const geolocationErrorMessage = (error) => {
  if (!error) return "Could not detect your location. Please try again.";

  if (error.code === 1) {
    return "Location permission denied. Allow location access and try again.";
  }

  if (error.code === 2) {
    return "Location unavailable right now. Please try again.";
  }

  if (error.code === 3) {
    return "Location request timed out. Please try again.";
  }

  return "Could not detect your location. Please try again.";
};
