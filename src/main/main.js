// main.js
require('dotenv').config();

const { app, BrowserWindow, ipcMain, Menu, dialog} = require('electron');
const path = require('path');
const exifr = require('exifr');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const heicConvert = require('heic-convert');
const image_thumbnail = require('image-thumbnail');
const os = require('os');

const userDataPath = app.getPath('userData');

const initialImagesPath = path.join(__dirname, '../../assets/initial_images');
const initialThumbnailPath = path.join(__dirname, '../../assets/thumbnails');
const dbPath = path.join(os.homedir(), 'MyAppData', 'photos.db');

Menu.setApplicationMenu(false);

// Ensure directory exists
if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

// Copy DB if it doesn't exist
if (!fs.existsSync(dbPath)) {
    fs.copyFileSync(path.join(__dirname, '../../database', 'photos.db'), dbPath);
}

const db = new sqlite3.Database(dbPath);

function copyInitialImages() {
    // Only run this on first launch
    const imagesPath = path.join(userDataPath, 'images');
    const thumbnailPath = path.join(userDataPath, 'thumbnails');

    if (!fs.existsSync(imagesPath)) {
        // Make images directory in userData folder
        fs.mkdirSync(imagesPath, { recursive: true });

        // Copy each initial image to the userData folder (if they exist)
        if (fs.existsSync(initialImagesPath)) {
            fs.readdirSync(initialImagesPath).forEach(async (file) => {
        
                let src = path.join(initialImagesPath, file);
                if (isHEIC(path.basename(src))){
                    return;
                }

                const dest = path.join(imagesPath, path.basename(src));
                fs.copyFileSync(src, dest);
            });

            console.log('Initial images copied to userData folder.');
        } else {
            console.log('No initial images folder found - app is ready for user uploads.');
        }
    }

    if (!fs.existsSync(thumbnailPath)) {
        // Make thumbnails directory in userData folder
        fs.mkdirSync(thumbnailPath, { recursive: true });

        // Copy each initial thumbnail to the userData folder (if they exist)
        if (fs.existsSync(initialThumbnailPath)) {
            fs.readdirSync(initialThumbnailPath).forEach(async (file) => {
        
                let src = path.join(initialThumbnailPath, file);
                const dest = path.join(thumbnailPath, path.basename(src));
                fs.copyFileSync(src, dest);
            });

            console.log('Initial thumbnails copied to userData folder.');
        }
    }

}

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    });

    win.loadFile(path.join(__dirname, '../renderer/index.html'));

    // Open DevTools with F12 or Ctrl+Shift+I
    win.webContents.on('before-input-event', (event, input) => {
        if (input.control && input.shift && input.key.toLowerCase() === 'i') {
            win.webContents.toggleDevTools();
        }
        if (input.key === 'F12') {
            win.webContents.toggleDevTools();
        }
    });
}

app.whenReady().then(copyInitialImages).then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.handle("getAllImages", async () => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM photos", [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        })
    })
})

ipcMain.handle("uploadPhoto", async () => {
    // Open dialog box to get image
    const result = await dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "Images", extensions: ["jpg", "jpeg", "heic"] }],
    });

    // Handle cancelled and empty filePaths
    if (result.cancelled || result.filePaths.length === 0){
        return null;
    }

    // Get first filepath
    const photoFilepath = result.filePaths[0];

    try{

        const filename = path.basename(photoFilepath);

        // Extract gpsData from photo
        const gpsData = await exifr.gps(photoFilepath);
        
        let latitude;
        let longitude;

        if(!gpsData){
            latitude = null;
            longitude = null;
        }
        else{
            latitude = gpsData.latitude;
            longitude = gpsData.longitude;
        }
        
        
        return {
            latitude: latitude,
            longitude: longitude,
            filepath: photoFilepath,
            filename: filename
        };

    }
    catch (error){
        console.error(error)
        return null;
    }
})

ipcMain.handle("insertPhoto", async (e, photoData) => {
    // Save data to userData folder
    console.log("Trying to save file: ", photoData.name)
    let src = "";
    const finalPath = path.join(userDataPath, 'images', photoData.name);
    const thumbnailPath = path.join(userDataPath, 'thumbnails', photoData.name);

    if(isHEIC(photoData.name)) {
        src = await converToJPG(photoData.path);
    }
    else {
        src = photoData.path;
    }

    const thumbnail = await image_thumbnail(src)

    fs.copyFileSync(src, finalPath);
    await fs.promises.writeFile(thumbnailPath, thumbnail);

    return new Promise((resolve, reject) =>{
        db.run(` INSERT INTO photos (filename, latitude, longitude) VALUES (?, ?, ?)`,
        [photoData.name, photoData.lat, photoData.lng], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({id: this.lastID, path: finalPath});
            }
        });
    })

});



ipcMain.handle("removePhoto", async (e, id) => {
    console.log("ID", id);
    if(id === undefined) {
        return false;
    }

    return new Promise((resolve => {
        db.get(`SELECT filename FROM photos
            WHERE id = ?`, [id], (err, row) => {
                if (err) {
                    console.log("Error deleting photo:", err)
                }
                else {
                    if (row) {
                        const filepath = path.join(userDataPath, 'images', row.filename);
                        const thumbnailPath = path.join(userDataPath, 'thumbnails', row.filename);
                        // Check if file exists
                        console.log(filepath)
                        if (fs.existsSync(filepath)) {
                            console.log("Found File.")
                            try{
                                fs.unlinkSync(filepath);
                                fs.unlinkSync(thumbnailPath);
                                console.log("File deleted successfully: ", filepath)
                                db.run(`DELETE FROM photos WHERE id = ?`, [id], (err) => {
                                    if(err){
                                        resolve(false);
                                    }
                                })
                                resolve(true);
    
                            } catch (err) {
                                console.error("Error deleting file: ", err)
                                resolve(false);
                            }
                        }
                    }
                    
                }
                resolve(false);
            });
    }));

})

ipcMain.handle("getUserDataPath", (event, filename) => {
    
    const filepath = path.join(userDataPath, 'images', filename);
    const thumbnail = path.join(userDataPath, 'thumbnails', filename);
    //const base64 = fs.readFileSync(filepath).toString('base64');
    return {fullImage: filepath, thumbnail: thumbnail};
})

async function converToJPG(inputPath) {
    // read file and create output buffer
    try {
        const inputBuffer = await fs.promises.readFile(inputPath);
        const outputBuffer = await heicConvert({
            buffer: inputBuffer,
            format: "JPEG",
            quality: 1 // Max quality
        });
        const outputPath = inputPath.replace(/\.heic$/i, ".JPG");
        await fs.promises.writeFile(outputPath, outputBuffer);
        console.log("Converted:", outputPath);
        console.log(outputPath);
        return outputPath;
    } catch (error) {
        console.log("Error converting to HEIC:", inputPath)
        console.log(error)
        return null;
    }

}

function isHEIC(filePath) {
    return filePath.toLowerCase().endsWith(".heic");
}
