export default async function handler(req, res) {

      // =========================
  // ✅ CORS FIX (REQUIRED)
  // =========================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request (IMPORTANT)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  try {
    const response = await fetch("https://api.lodgify.com/v2/properties/", {
      headers: {
        "X-ApiKey": process.env.LODGIFY_API_KEY
      }
    });

    // 👇 check if response is OK first
    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        error: "Lodgify API error1",
        details: text
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}