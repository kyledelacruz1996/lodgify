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
    // GET ID FROM ROUTE PARAM
    // =========================
    const { id, start: startParam, end: endParam } = req.query;

    // =========================
    // BUILD URL
    // =========================
    const url = id
      ? {
          property: `https://api.lodgify.com/v2/properties/${id}`,
          availability: `https://api.lodgify.com/v2/availability?propertyId=${id}&start=${startParam}&end=${endParam}`,
        }
      : {
          property: "https://api.lodgify.com/v2/properties",
        };

    // =========================
    // FIX: convert object → string URL (minimal change)
    // =========================
    const finalUrl = url.property;

    // =========================
    // FETCH LODGIFY
    // =========================
    const response = await fetch(finalUrl, {
      method: "GET",
      headers: {
        "X-ApiKey": API_KEY,
        "Content-Type": "application/json",
      },
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      return res.status(500).json({
        error: "Invalid JSON from Lodgify",
        raw: text,
      });
    }

    // =========================
    // HANDLE API ERRORS
    // =========================
    if (!response.ok) {
      return res.status(response.status).json({
        error: "Lodgify API error",
        details: data,
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}