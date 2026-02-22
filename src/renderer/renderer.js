let map;
let markers = new Map();
let selectedMarkerId = null;
let selectLocation = false;
let uploadFilename = null;
let uploadFilepath = null;

document.addEventListener("DOMContentLoaded", async () => {
    console.log("Initializing map...");

    // Ensure Leaflet is available
    if (typeof L === "undefined") {
        console.error("Leaflet failed to load!");
        return;
    }
    
    // Create the map
    map = L.map('map', {
        minZoom: 3
    }).setView([40.7128, -74.0060], 10);

    // Get MapTiler API key from preload script
    const apiKey = window.api.getMapTilerKey() || "";
    const mapId = "fad4dd51-7e7f-4894-b764-ae851db70af7";

    if (!apiKey) {
        console.warn("MapTiler API key not found. Map may not display correctly. Set MAPTILER_API_KEY environment variable.");
    }

    const mtLayer = new L.maptiler.maptilerLayer({
        apiKey: apiKey,
        style: `https://api.maptiler.com/maps/${mapId}/style.json?key=${apiKey}`,
        minZoom: 2
      }).addTo(map);


      map.on("click", async (event) => {

        // Only allow this when a photo is uploaded with no gps data
        if (!selectLocation) {return;}
        

        const lat = event.latlng.lat;
        const lng = event.latlng.lng;
    
        console.log(`Lat: ${lat}, long: ${lng}`)
        
        // Set popup at clicked location, prompting confirmation
        const popup = L.popup()
        .setLatLng([lat, lng])
        .setContent(`
            <div>
                <button class="popup-button" id="confirmLocation">Confirm</button>
            </div>
        `)
        .openOn(map);
        
        // Set flag to false and insert photo, clear variables
        document.getElementById("confirmLocation").addEventListener("click", () => {
            console.log(`Image assigned to: ${lat}, ${lng}`);
            map.closePopup();

            selectLocation = false;


            if(!uploadFilename || !uploadFilepath) {
                alert("Unable to load image");
            }
            else {
                insertPhoto(uploadFilename, uploadFilepath, lat, lng);
            }

            uploadFilename = null;
            uploadFilepath = null;
            const cursorMessage = document.getElementById("confirm");
            let titleBar = document.getElementById("titleBar");
            titleBar.removeChild(cursorMessage);
            
        });
        
    })

    populateMap();

});


document.getElementById("uploadBtn").addEventListener("click", async () => {
    // get filename, latitude and longitutde
    const exifData = await window.api.uploadPhoto();

    if (!exifData.latitude && !exifData.longitude) {
        // Enable map click, temporarily save file info for later upload
        selectLocation = true;
        uploadFilepath = exifData.filepath;
        uploadFilename = exifData.filename;

        let cursorMessage = document.createElement("h2");
        let titleBar = document.getElementById("titleBar");
        console.log(titleBar.className);
        //cursorMessage.className = "cursor-message";
        cursorMessage.id = "confirm";
        cursorMessage.innerHTML = "Click map to select location!";
        titleBar.appendChild(cursorMessage);

        return;
    }
    
    // Insert the photo
    console.log("Got GPS data for:", exifData.filename)
    console.log("Exif data:", exifData);
    insertPhoto(exifData.filename,
        exifData.filepath,
        exifData.latitude,
        exifData.longitude
    )
});

async function populateMap() {
    // Populates the map with all photos in database
    const data = await window.api.getAllImages();
    
    try {
        data.forEach(async (row) => {
            
            if (row.latitude !== undefined && row.longitude !== undefined){
                console.log("Filename:", row.filename);
                addMarker(row.latitude, row.longitude, row.id, row.filename);
               
                
            }
            else {
                console.log("Found undefined data in: ", row.filename)
                console.log(row.latitude, row.longitude)
            }
        })
    } catch (err) {
        console.log("Error fetching data", err)
    }
}

async function insertPhoto(filename, filepath, latitude, longitude) {
    // Send info to main and insert new photo
    console.log(`Insert Photo filename ${filename}`)
    const result = await window.api.insertPhoto({
        name: filename,
        path: filepath,
        lat: latitude,
        lng: longitude
    });
    
    console.log("Added marker with id: ", result.id)
    // Add marker to map and zoom to it
    if(result.id !== null) {
        addMarker(latitude, longitude, result.id, filename);
        map.flyTo([latitude, longitude], 17);
    }


}

async function addMarker(latitude, longitude, id, filename) {
    // Create delete button for marker
    const deleteButton = document.createElement("button");
    deleteButton.className = "popup-button"
    deleteButton.innerHTML = `Delete`;

    const photo = await window.api.getUserDataPath(filename);

    const popupDiv = document.createElement("div");
    popupDiv.className = "popup-div";

    const popupImg = document.createElement("img");
    popupImg.src = photo.fullImage;
    popupImg.className = "popup-image";

    popupDiv.appendChild(popupImg);
    popupDiv.appendChild(deleteButton);

    // Define popup for marker click
    const popup = L.popup().setContent(popupDiv);

    // Create icon with relevant image  
    const photoIcon = L.icon({
        // iconUrl: `data:image/jpg;base64,${base64}`,
        iconUrl: photo.thumbnail,
        iconSize: [30, 30],
        className: 'circular-icon' // Custom class for styling
    });

    const marker = L.marker([latitude, longitude], {icon: photoIcon, markerId: id}).addTo(map).bindPopup(popup);

    deleteButton.addEventListener("click", async () => {
        const id = marker.options.markerId;
        console.log(id);
        const success = await window.api.removePhoto(id)
        console.log("Succes?:", success);
        if(success) {
            marker.remove();
        }
    })
}
