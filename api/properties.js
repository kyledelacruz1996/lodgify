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
    // GET ID + DATES
    // =========================
    const { id, start: startParam, end: endParam } = req.query;

    // =========================
    // BUILD URLS
    // =========================
    const propertyUrl = id
      ? `https://api.lodgify.com/v2/properties/${id}`
      : "https://api.lodgify.com/v2/properties";

    const availabilityUrl =
      id && startParam && endParam
        ? `https://api.lodgify.com/v2/availability?propertyId=${id}&start=${startParam}&end=${endParam}`
        : null;

    // =========================
    // FETCH DATA
    // =========================
    const requests = [
      fetch(propertyUrl, {
        method: "GET",
        headers: {
          "X-ApiKey": API_KEY,
          "Content-Type": "application/json",
        },
      }),
    ];

    if (availabilityUrl) {
      requests.push(
        fetch(availabilityUrl, {
          method: "GET",
          headers: {
            "X-ApiKey": API_KEY,
            "Content-Type": "application/json",
          },
        })
      );
    }

    const responses = await Promise.all(requests);

    const propertyText = await responses[0].text();
    let propertyData;

    try {
      propertyData = JSON.parse(propertyText);
    } catch {
      return res.status(500).json({
        error: "Invalid JSON from Lodgify (property)",
        raw: propertyText,
      });
    }

    let availabilityData = null;

    if (responses[1]) {
      const availabilityText = await responses[1].text();

      try {
        availabilityData = JSON.parse(availabilityText);
      } catch {
        return res.status(500).json({
          error: "Invalid JSON from Lodgify (availability)",
          raw: availabilityText,
        });
      }
    }

    // =========================
    // HANDLE ERRORS
    // =========================
    if (!responses[0].ok) {
      return res.status(responses[0].status).json({
        error: "Lodgify Property API error",
        details: propertyData,
      });
    }

    if (responses[1] && !responses[1].ok) {
      return res.status(responses[1].status).json({
        error: "Lodgify Availability API error",
        details: availabilityData,
      });
    }

    // =========================
    // FINAL RESPONSE
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