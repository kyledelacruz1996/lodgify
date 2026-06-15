export default async function handler(req, res) {
  // =========================
  // CORS (Webflow support)
  // =========================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const API_KEY = process.env.LODGIFY_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({
        error: "Missing LODGIFY_API_KEY in environment variables",
      });
    }

    // =========================
    // QUERY PARAMS
    // =========================
    const { id, start, end } = req.query;

    if (!id) {
      return res.status(400).json({
        error: "Missing property id",
      });
    }

    // =========================
    // DEFAULT DATE RANGE (30 days)
    // =========================
    const today = new Date();
    const defaultStart = start || today.toISOString().split("T")[0];

    const defaultEndDate = new Date();
    defaultEndDate.setDate(today.getDate() + 30);
    const defaultEnd = end || defaultEndDate.toISOString().split("T")[0];

    if (!id) {
      const propertiesRes = await fetch(
        "https://api.lodgify.com/v2/properties",
        { method: "GET", headers },
      );

      const propertiesText = await propertiesRes.text();

      let propertiesData;
      try {
        propertiesData = JSON.parse(propertiesText);
      } catch {
        return res.status(500).json({
          error: "Invalid JSON from properties API",
          raw: propertiesText,
        });
      }

      if (!propertiesRes.ok) {
        return res.status(propertiesRes.status).json({
          error: "Properties API error",
          details: propertiesData,
        });
      }

      return res.status(200).json({
        mode: "all",
        count: propertiesData?.items?.length || 0,
        properties: propertiesData,
      });
    }

    // =========================
    // ENDPOINTS
    // =========================
    const propertyUrl = `https://api.lodgify.com/v2/properties/${id}`;

    // 🔥 IMPORTANT: THIS IS THE CORRECT ONE
    const availabilityUrl = `https://api.lodgify.com/v2/availability?propertyId=${id}&start=${defaultStart}&end=${defaultEnd}`;

    // =========================
    // FETCH IN PARALLEL
    // =========================
    const [propertyRes, availabilityRes] = await Promise.all([
      fetch(propertyUrl, {
        method: "GET",
        headers: {
          "X-ApiKey": API_KEY,
          "Content-Type": "application/json",
        },
      }),
      fetch(availabilityUrl, {
        method: "GET",
        headers: {
          "X-ApiKey": API_KEY,
          "Content-Type": "application/json",
        },
      }),
    ]);

    const [propertyText, availabilityText] = await Promise.all([
      propertyRes.text(),
      availabilityRes.text(),
    ]);

    let propertyData, availabilityData;

    try {
      propertyData = JSON.parse(propertyText);
    } catch {
      return res.status(500).json({
        error: "Invalid JSON from property API",
        raw: propertyText,
      });
    }

    try {
      availabilityData = JSON.parse(availabilityText);
    } catch {
      return res.status(500).json({
        error: "Invalid JSON from availability API",
        raw: availabilityText,
      });
    }

    // =========================
    // ERROR HANDLING
    // =========================
    if (!propertyRes.ok) {
      return res.status(propertyRes.status).json({
        error: "Property API error",
        details: propertyData,
      });
    }

    if (!availabilityRes.ok) {
      return res.status(availabilityRes.status).json({
        error: "Availability API error",
        details: availabilityData,
      });
    }

    // =========================
    // FORMAT CALENDAR (CLEAN FOR FRONTEND)
    // =========================
    const calendar =
      availabilityData?.dateWiseAvailability?.map((day) => ({
        date: day.date,
        status: day.status,
        price: day.price?.amount || null,
        currency: day.price?.currency || null,
        minNights: day.minimumNights || null,
      })) || [];

    // =========================
    // FINAL RESPONSE
    // =========================
    return res.status(200).json({
      property: propertyData,
      calendar,
      rawCalendar: availabilityData,
      range: {
        start: defaultStart,
        end: defaultEnd,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}
