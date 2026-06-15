export default async function handler(req, res) {
  // =========================
  // CORS (required for Webflow)
  // =========================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const API_KEY = process.env.LODGIFY_API_KEY;

    // =========================
    // CHECK API KEY
    // =========================
    if (!API_KEY) {
      return res.status(500).json({
        error: "Missing LODGIFY_API_KEY in Vercel environment variables",
      });
    }

    // =========================
    // GET PROPERTY ID
    // =========================
    const { id } = req.query;

    // =========================
    // BUILD URLS (IMPORTANT FIX)
    // =========================
    const propertyUrl = id
      ? `https://api.lodgify.com/v2/properties/${id}`
      : "https://api.lodgify.com/v2/properties";

    const availabilityUrl = id
      ? `https://api.lodgify.com/v2/availability?propertyId=${id}&start=2026-06-01&end=2027-06-01`
      : null;

    // =========================
    // FETCH PROPERTY
    // =========================
    const propertyResponse = await fetch(propertyUrl, {
      method: "GET",
      headers: {
        "X-ApiKey": API_KEY,
        "Content-Type": "application/json",
      },
    });

    const propertyText = await propertyResponse.text();

    let propertyData;
    try {
      propertyData = JSON.parse(propertyText);
    } catch (err) {
      return res.status(500).json({
        error: "Invalid JSON from Lodgify (property)",
        raw: propertyText,
      });
    }

    if (!propertyResponse.ok) {
      return res.status(propertyResponse.status).json({
        error: "Lodgify property API error",
        details: propertyData,
      });
    }

    // =========================
    // FETCH AVAILABILITY (CALENDAR)
    // =========================
    let availabilityData = null;

    if (availabilityUrl) {
      const availabilityResponse = await fetch(availabilityUrl, {
        method: "GET",
        headers: {
          "X-ApiKey": API_KEY,
          "Content-Type": "application/json",
        },
      });

      const availabilityText = await availabilityResponse.text();

      try {
        availabilityData = JSON.parse(availabilityText);
      } catch (err) {
        availabilityData = {
          error: "Invalid JSON from Lodgify (availability)",
          raw: availabilityText,
        };
      }
    }

    // =========================
    // RETURN FINAL RESPONSE
    // =========================
    return res.status(200).json({
      property: propertyData,
      availability: availabilityData,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}