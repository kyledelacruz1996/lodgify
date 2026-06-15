export default async function handler(req, res) {
  // =========================
  // CORS
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
        error: "Missing LODGIFY_API_KEY",
      });
    }

    // =========================
    // DATE RANGE (default 30 days)
    // =========================
    const today = new Date();
    const start =
      req.query.start || today.toISOString().split("T")[0];

    const endDate = new Date();
    endDate.setDate(today.getDate() + 30);
    const end =
      req.query.end || endDate.toISOString().split("T")[0];

    // =========================
    // 1. FETCH ALL PROPERTIES
    // =========================
    const propertiesRes = await fetch(
      "https://api.lodgify.com/v2/properties",
      {
        method: "GET",
        headers: {
          "X-ApiKey": API_KEY,
          "Content-Type": "application/json",
        },
      }
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
        error: "Failed to fetch properties",
        details: propertiesData,
      });
    }

    // =========================
    // NORMALIZE PROPERTIES ARRAY
    // =========================
    const properties =
      propertiesData?.items ||
      propertiesData ||
      [];

    // =========================
    // 2. FETCH CALENDAR FOR EACH PROPERTY
    // =========================
    const results = await Promise.all(
      properties.map(async (property) => {
        const id = property.id;

        const availabilityUrl = `https://api.lodgify.com/v2/availability?propertyId=${id}&start=${start}&end=${end}`;

        try {
          const calRes = await fetch(availabilityUrl, {
            method: "GET",
            headers: {
              "X-ApiKey": API_KEY,
              "Content-Type": "application/json",
            },
          });

          const calText = await calRes.text();

          let calData;
          try {
            calData = JSON.parse(calText);
          } catch {
            calData = null;
          }

          const calendar =
            calData?.dateWiseAvailability?.map((d) => ({
              date: d.date,
              status: d.status,
              price: d.price?.amount || null,
            })) || [];

          return {
            property: {
              id: property.id,
              name: property.name,
              location: property.location,
            },
            calendar,
          };
        } catch (err) {
          return {
            property: {
              id: property.id,
              name: property.name,
            },
            error: err.message,
          };
        }
      })
    );

    // =========================
    // FINAL RESPONSE
    // =========================
    return res.status(200).json({
      count: results.length,
      range: { start, end },
      data: results,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}