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

    const { id, calendar } = req.query;

    // =========================
    // GET ALL PROPERTIES
    // =========================
    if (!id) {
      const response = await fetch(
        "https://api.lodgify.com/v2/properties",
        {
          method: "GET",
          headers: {
            "X-ApiKey": API_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      return res.status(response.status).json(data);
    }

    // =========================
    // GET PROPERTY DETAILS
    // =========================
    const propertyResponse = await fetch(
      `https://api.lodgify.com/v2/properties/${id}`,
      {
        method: "GET",
        headers: {
          "X-ApiKey": API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const property = await propertyResponse.json();

    // =========================
    // RETURN PROPERTY ONLY
    // =========================
    if (calendar !== "true") {
      return res.status(200).json(property);
    }

    // =========================
    // CALENDAR DATE RANGE
    // =========================
    const today = new Date();

    const startDate = today.toISOString().split("T")[0];

    const endDateObj = new Date();
    endDateObj.setMonth(endDateObj.getMonth() + 12);

    const endDate = endDateObj.toISOString().split("T")[0];

    // =========================
    // FETCH AVAILABILITY
    // =========================
    const availabilityResponse = await fetch(
      `https://api.lodgify.com/v2/availability?propertyId=${id}&start=${startDate}&end=${endDate}`,
      {
        method: "GET",
        headers: {
          "X-ApiKey": API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const availabilityText = await availabilityResponse.text();

    let availability;

    try {
      availability = JSON.parse(availabilityText);
    } catch (e) {
      availability = {
        error: "Availability response is not JSON",
        raw: availabilityText,
      };
    }

    return res.status(200).json({
      property,
      availability,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}