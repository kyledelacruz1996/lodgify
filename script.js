const loadBtn = document.getElementById("loadProperties");
const propertiesContainer = document.getElementById("properties");

loadBtn.addEventListener("click", loadProperties);

async function loadProperties() {
  try {
    propertiesContainer.innerHTML = "<p>Loading...</p>";

    const response = await fetch("/api/properties");
    const data = await response.json();

    console.log("API Response:", data);

    if (!data.items || data.items.length === 0) {
      propertiesContainer.innerHTML =
        "<p>No properties found.</p>";
      return;
    }

    propertiesContainer.innerHTML = "";

    data.items.forEach(property => {
      const div = document.createElement("div");

      div.className = "property";

      div.innerHTML = `
        <h2>${property.name}</h2>

        <p>
          <strong>ID:</strong>
          ${property.id}
        </p>

        <p>
          <strong>Description:</strong>
          ${property.description || "No description"}
        </p>

        <p>
          <strong>Latitude:</strong>
          ${property.latitude}
        </p>

        <p>
          <strong>Longitude:</strong>
          ${property.longitude}
        </p>

        <pre>${JSON.stringify(property, null, 2)}</pre>
      `;

      propertiesContainer.appendChild(div);
    });

  } catch (error) {
    console.error(error);

    propertiesContainer.innerHTML = `
      <p>Error loading properties.</p>
    `;
  }
}