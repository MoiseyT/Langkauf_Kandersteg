// Global variable to hold elevation control instance
let controlElevation = null;

// Global variable to store the current map instance
let currentMap = null;

function showPopupWithMap(object) {
    // Initialize popup elements if not already initialized
    if (!popup) {
        popup = document.getElementById("popup");
        popupTitle = document.getElementById("popup-title");
        popupsubTitle = document.getElementById("popup-subtitle");
        popupClose = document.getElementById("popup-close");
    }

    // Set title and subtitle text content based on object properties
    popupTitle.textContent = `${object.track_name}`;
    popupsubTitle.textContent = `${object.complexity}`;

    // Remove existing map if any, to avoid duplicates
    let existingMap = popup.querySelector("#leaflet-map");
    if (existingMap) {
        popup.removeChild(existingMap);
    }

    // Create a new container for the map and append it to the popup
    let mapContainer = createLeafletMap("leaflet-map");
    popup.appendChild(mapContainer);

    // Elevation plugin options
    let elevation_options = {
        theme: "lightblue-theme",
        detached: true,
        elevationDiv: "#elevation-div",
        autohide: false,
        collapsed: false,
        position: "topright",
        closeBtn: true,
        followMarker: true,
        autofitBounds: true,
        imperial: false,
        reverseCoords: false,
        acceleration: false,
        slope: false,
        speed: false,
        altitude: true,
        time: false,
        distance: true,
        summary: 'multiline',
        downloadLink: 'link',
        ruler: true,
        legend: true,
        almostOver: true,
        distanceMarkers: false,
        hotline: true,
        timestamps: false,
        waypoints: true,
        wptIcons: {
            '': L.divIcon({
                className: 'elevation-waypoint-marker',
                html: '<i class="elevation-waypoint-icon"></i>',
                iconSize: [30, 30],
                iconAnchor: [8, 30],
            }),
        },
        wptLabels: true,
        preferCanvas: true,
    };

    // Create a new Leaflet map instance
    currentMap = L.map(mapContainer).setView([0, 0], 11);

    // Add OpenStreetMap tile layer to the map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(currentMap);

    // Add elevation control to the map
    controlElevation = L.control.elevation(elevation_options).addTo(currentMap);

    // Load the GPX track or another elevation source
    controlElevation.load(`${object.link_track}`);

    // Make the popup visible
    popup.style.display = "flex";
}

function createLeafletMap(containerId) {
    // Create a new div element to serve as the map container
    let mapContainer = document.createElement("div");
    mapContainer.id = containerId;
    mapContainer.classList.add("leaflet-map");
    return mapContainer;
}
