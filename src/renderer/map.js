document.addEventListener("DOMContentLoaded", function () {
    console.log("Initializing map...");

    // Ensure Leaflet is available
    if (typeof L === "undefined") {
        console.error("Leaflet failed to load!");
        return;
    }
    
    // Create the map
    var map = L.map('map').setView([40.7128, -74.0060], 10); // Default to NYC

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
});
