# PhotoMap

A desktop application for viewing and organizing your photos on an interactive map using EXIF metadata.

## Features

- **Interactive Map View**: View all your photos pinned to their GPS locations on an interactive map powered by MapTiler and Leaflet
- **EXIF GPS Extraction**: Automatically extracts location data from photo metadata
- **Manual Location Assignment**: For photos without GPS data, manually assign locations by clicking on the map
- **Photo Upload**: Easily upload new photos (JPG, JPEG, HEIC formats supported)
- **Photo Management**: Delete photos from the map and database
- **Image Conversion**: Automatically converts HEIC photos to JPG format
- **Thumbnail Generation**: Creates thumbnails for faster loading and map display

## Preview

![PhotoMap Demo](assets/gif/Animation.gif)

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Desktop Framework**: Electron
- **Mapping**: Leaflet + MapTiler SDK
- **Backend**: Node.js
- **Database**: SQLite3
- **Image Processing**: exifr, heic-convert, image-thumbnail

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A MapTiler API key (free account at [maptiler.com](https://www.maptiler.com))

### Setup Steps

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd PhotoMap
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Set up your MapTiler API key (required):
   - Copy the example file:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and add your MapTiler API key:
     ```
     MAPTILER_API_KEY=your_api_key_here
     ```
   - Get a free API key from [MapTiler](https://www.maptiler.com/) - sign up, visit your dashboard, and copy your API key

## Usage

### Running the App

Start the application:
```bash
npm start
```

This launches the Electron desktop application with your map view.

### Basic Workflow

1. **Launch the App**: The application opens with an interactive map
2. **Upload Photos**: Click "Upload Photo..." to add images from your computer
   - If the photo has GPS data, it will automatically appear on the map
   - If no GPS data is found, click on the map to manually assign a location
3. **View Photos**: Click on any map marker to see a preview of the photo
4. **Delete Photos**: Click "Delete" in the photo preview popup to remove it

### Supported Photo Formats

- JPG/JPEG
- HEIC (automatically converted to JPG)

## Project Structure

```
.
├── src/
│   ├── main/
│   │   ├── main.js        # Electron main process
│   │   └── preload.js     # Electron preload (API bridge)
│   └── renderer/
│       ├── index.html     # Main HTML file
│       ├── renderer.js    # Frontend logic and map interaction
│       ├── map.js         # Map utilities
│       └── styles.css     # Application styling
├── scripts/               # Utility scripts
│   ├── database.js
│   ├── clear_database.js
│   ├── view_db.js
│   ├── convert.js
│   └── makethumb.py
├── assets/
│   ├── fonts/
│   ├── gif/               # Demo GIF
│   ├── initial_images/    # (Not committed - for development only)
│   └── thumbnails/        # (Not committed - for development only)
├── database/
│   └── photos.db          # Empty template database
├── .env.example           # Environment configuration template
├── package.json           # Node.js dependencies
└── README.md              # Project documentation
```

## Database

The application uses SQLite to store photo metadata:
- **Template**: `database/photos.db` (included in repo - clean schema only)
- **User Data Location** (varies by OS):
  - **Windows**: `%APPDATA%\photomap\` (usually `C:\Users\<username>\AppData\Roaming\photomap\`)
  - **macOS**: `~/Library/Application Support/photomap/`
  - **Linux**: `~/.config/photomap/`
- **Auto-initialized**: Template database is copied to user data location on first launch
- **Stores**: Photo filenames, latitude, longitude coordinates, and IDs

## Environment Variables

- `MAPTILER_API_KEY`: Your MapTiler API key (required for map functionality)

## Scripts

- `npm start`: Launch the desktop application
- `npm run build`: Build the application (requires electron-builder configured)

## Platform Support

- Windows
- macOS  
- Linux

The application stores user photos and database files in the appropriate user data directories for each platform.

## License

ISC

## Author

AJ Kraus

## Contributing

Feel free to submit issues and enhancement requests!

## Known Limitations

- HEIC photos are converted to JPEG, which may affect quality depending on conversion settings
- Map performance may decrease with very large numbers of photos (1000+)

## Troubleshooting

### Map not loading?
- Make sure `MAPTILER_API_KEY` is set in your `.env` file
- Check that you have an active internet connection
- Verify your MapTiler API key is valid
- Open DevTools (F12) and check the console for errors

### Photos not appearing on map?
- Ensure photos have valid GPS EXIF data
- For photos without GPS data, you must click on the map to assign a location manually
- Check the application console (DevTools) for any error messages

### HEIC conversion fails?
- Ensure the heic-convert package is properly installed
- Check that you have write permissions to the application's temp directory

## Support

For issues, questions, or suggestions, please open an issue in the repository.
