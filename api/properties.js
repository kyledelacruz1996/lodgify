export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const API_KEY = process.env.LODGIFY_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: "Missing API KEY" });
    }

    const id = req.query.id || req.query.Id;
    const start = req.query.start;
    const end = req.query.end;

    const isValidDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);
    const validDates = start && end && isValidDate(start) && isValidDate(end);

    const propertyUrl = id
      ? `https://api.lodgify.com/v2/properties/${id}`
      : "https://api.lodgify.com/v2/properties";

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
      return res.status(500).json({ error: "Invalid property JSON" });
    }

    if (!propertyResponse.ok) {
      return res.status(propertyResponse.status).json(propertyData);
    }

    // =========================
    // ⭐ FIX: SORT CORRECT STRUCTURE
    // =========================
    if (propertyData && Array.isArray(propertyData.items)) {
      propertyData.items.sort((a, b) => (a.id || 0) - (b.id || 0));
    }

    // =========================
    // FETCH AVAILABILITY
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
        return res.status(500).json({ error: "Invalid availability JSON" });
      }

      if (!availabilityResponse.ok) {
        return res.status(availabilityResponse.status).json(availabilityData);
      }
    }

    return res.status(200).json({
      property: propertyData,
      availability: availabilityData,
      meta: {
        id: id || null,
        start: validDates ? start : null,
        end: validDates ? end : null,
        sorted: !!propertyData?.items,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}