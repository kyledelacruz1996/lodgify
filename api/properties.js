export default async function handler(req, res) {
  // =========================
  // CORS (required for Webflow)
  // =========================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // =========================
  // CHECK IP ADDRESS 
  // =========================
  const allowedIP = "172.64.151.8"; // Lodgify's IP address (as of 2024-06)

  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || "";

  const apiKey = req.headers["x-api-key"];

  if (ip !== allowedIP || apiKey !== process.env.LODGIFY_API_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }

  res.status(200).json({ message: "Access granted" });

  // =========================
  // CHECK Hostname
  // =========================

//   const allowedOrigin = "https://staywildescape.webflow.io";
// const apiKey = req.headers["x-api-key"];

// const origin = req.headers.origin || "";

// if (origin !== allowedOrigin || apiKey !== process.env.LODGIFY_API_KEY) {
//   return res.status(403).json({ message: "Forbidden" });
// }

// return res.status(200).json({ message: "Access granted" });

  //----------------------------------------------------

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
    // FETCH LODGIFY
    // =========================
    const response = await fetch("https://api.lodgify.com/v2/properties", {
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
