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

    if (!API_KEY) {
      return res.status(500).json({
        error: "Missing LODGIFY_API_KEY in Vercel environment variables",
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
    // PROPERTY ENDPOINT
    // =========================
    const propertyUrl = `https://api.lodgify.com/v2/properties/${id}`;

    // =========================
    // CALENDAR ENDPOINT
    // =========================
    const calendarUrl = new URL("https://api.lodgify.com/v2/calendar");
    calendarUrl.searchParams.append("propertyId", id);

    // optional date range (recommended)
    if (start) calendarUrl.searchParams.append("start", start);
    if (end) calendarUrl.searchParams.append("end", end);

    // =========================
    // FETCH BOTH IN PARALLEL
    // =========================
    const [propertyRes, calendarRes] = await Promise.all([
      fetch(propertyUrl, {
        method: "GET",
        headers: {
          "X-ApiKey": API_KEY,
          "Content-Type": "application/json",
        },
      }),
      fetch(calendarUrl.toString(), {
        method: "GET",
        headers: {
          "X-ApiKey": API_KEY,
          "Content-Type": "application/json",
        },
      }),
    ]);

    const [propertyText, calendarText] = await Promise.all([
      propertyRes.text(),
      calendarRes.text(),
    ]);

    let propertyData, calendarData;

    try {
      propertyData = JSON.parse(propertyText);
    } catch {
      return res.status(500).json({
        error: "Invalid JSON from Lodgify (property)",
        raw: propertyText,
      });
    }

    try {
      calendarData = JSON.parse(calendarText);
    } catch {
      return res.status(500).json({
        error: "Invalid JSON from Lodgify (calendar)",
        raw: calendarText,
      });
    }

    // =========================
    // HANDLE API ERRORS
    // =========================
    if (!propertyRes.ok) {
      return res.status(propertyRes.status).json({
        error: "Lodgify property API error",
        details: propertyData,
      });
    }

    if (!calendarRes.ok) {
      return res.status(calendarRes.status).json({
        error: "Lodgify calendar API error",
        details: calendarData,
      });
    }

    // =========================
    // FINAL RESPONSE
    // =========================
    return res.status(200).json({
      property: propertyData,
      calendar: calendarData,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}