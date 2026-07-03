<script>
const loadBtn = document.getElementById("loadProperties");
const propertiesContainer = document.getElementById("properties");

loadBtn.addEventListener("click", loadProperties);

async function loadProperties() {
  try {
    propertiesContainer.innerHTML = "<p>Loading...</p>";

    // Get all properties
    const response = await fetch("/api/properties");
    const data = await response.json();

    console.log("Properties:", data);

    if (!data.items || data.items.length === 0) {
      propertiesContainer.innerHTML = "<p>No properties found.</p>";
      return;
    }

    propertiesContainer.innerHTML = "";

    for (const property of data.items) {
      // Get property details + rooms + availability
      const detailsRes = await fetch(`/api/properties?id=${property.id}`);
      const details = await detailsRes.json();

      console.log("Property Details:", details);

      const rooms = details.rooms || [];

      const div = document.createElement("div");
      div.className = "property";

      div.innerHTML = `
        <h2>${property.name}</h2>

        <p><strong>ID:</strong> ${property.id}</p>

        <p>
          <strong>Description:</strong>
          ${property.description || "No description"}
        </p>

        <p>
          <strong>Latitude:</strong>
          ${property.latitude ?? "-"}
        </p>

        <p>
          <strong>Longitude:</strong>
          ${property.longitude ?? "-"}
        </p>

        <hr>

        <h3>Rooms (${rooms.length})</h3>

        ${
          rooms.length
            ? `
              <ul>
                ${rooms
                  .map(
                    (room) => `
                      <li>
                        <strong>${room.name || room.roomTypeName || "Unnamed Room"}</strong><br>
                        ID: ${room.id}<br>
                        Sleeps: ${room.maxGuests ?? "-"}
                      </li>
                    `
                  )
                  .join("")}
              </ul>
            `
            : "<p>No rooms found.</p>"
        }

        <hr>

        <details>
          <summary>Property JSON</summary>
          <pre>${JSON.stringify(details.property, null, 2)}</pre>
        </details>

        <details>
          <summary>Rooms JSON</summary>
          <pre>${JSON.stringify(rooms, null, 2)}</pre>
        </details>

        <details>
          <summary>Calendar JSON</summary>
          <pre>${JSON.stringify(details.calendar, null, 2)}</pre>
        </details>
      `;

      propertiesContainer.appendChild(div);
    }

  } catch (error) {
    console.error(error);

    propertiesContainer.innerHTML = `
      <p>Error loading properties.</p>
    `;
  }
}
</script>