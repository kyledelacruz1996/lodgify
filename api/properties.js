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
    // GET QUERY PARAMS (SAFE)
    // =========================
    const id = req.query.id || req.query.Id;
    const start = req.query.start;
    const end = req.query.end;

    // =========================
    // DATE VALIDATION
    // =========================
    const isValidDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);
    const validDates = start && end && isValidDate(start) && isValidDate(end);

    // =========================
    // BUILD PROPERTY URL
    // =========================
    const propertyUrl = id
      ? `https://api.lodgify.com/v2/properties/${id}`
      : "https://api.lodgify.com/v2/properties";

    // =========================
    // BUILD AVAILABILITY URL
    // =========================
    const availabilityUrl =
      id && validDates
        ? `https://api.lodgify.com/v2/availability?propertyId=${id}&start=${start}&end=${end}`
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
    } catch {
      return res.status(500).json({
        error: "Invalid JSON from Lodgify (property)",
        raw: propertyText,
      });
    }

    if (!propertyResponse.ok) {
      return res.status(propertyResponse.status).json({
        error: "Lodgify Property API error",
        details: propertyData,
      });
    }

    // =========================
    // FETCH AVAILABILITY (SAFE)
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
      } catch {
        return res.status(500).json({
          error: "Invalid JSON from Lodgify (availability)",
          raw: availabilityText,
        });
      }

      if (!availabilityResponse.ok) {
        return res.status(availabilityResponse.status).json({
          error: "Lodgify Availability API error",
          details: availabilityData,
        });
      }
    }

    // =========================
    // FINAL RESPONSE
    // =========================
    return res.status(200).json({
      property: propertyData,
      availability: availabilityData,
      meta: {
        id: id || null,
        start: validDates ? start : null,
        end: validDates ? end : null,
        hasAvailability: !!availabilityUrl,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}