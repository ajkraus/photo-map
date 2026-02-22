const testFolder = 'assets/initial_images';
const fs = require('fs');
const exifr = require('exifr');
const path = require('path');
const heicConvert = require('heic-convert');
const sqlite3 = require('sqlite3');

const dbPath = "photos.db";

const db = new sqlite3.Database(dbPath, (err) => {
    if(err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.')
    }
})

db.serialize(async () =>{
    
    db.run("DROP TABLE IF EXISTS photos")

    db.run(`
        CREATE TABLE IF NOT EXISTS photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT,
            latitude REAL,
            longitude REAL
        )
    `, (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
        }
    });
});



function insertPhoto(filename, latitude, longitude) {
    return new Promise((resolve, reject) => {
        db.run(`
            INSERT INTO photos (filename, latitude, longitude) VALUES (?, ?, ?)
        `, [filename, latitude, longitude], function(err) {
            if (err) {
                console.log("Error inputting file", err)
                reject(err);
            } else {
                console.log("file input successfully")
                resolve({ id: this.lastID });
            }
        });
    });
}

function isHEIC(filePath) {
    return filePath.toLowerCase().endsWith(".heic");
}


async function insertAllPhotos(directory) {
    try {
        const files = await fs.promises.readdir(directory);
        const insertPromises = files.map(async (file) => {
            let fullPath = path.join(directory, file);
            // Dummy values for lat/lng (replace with actual logic)
            console.log(fullPath);
            const data = await exifr.gps(fullPath);
            
            if (isHEIC(fullPath)) {
                fullPath = fullPath.replace(/\.heic$/i, ".JPG")
            }
           
            if(data !== undefined) {
                return insertPhoto(path.basename(fullPath), data.latitude, data.longitude);
            }
            // else {
            //     console.log("Data:", data, " Filepath: ", fullPath);
            // }
            
        });

        await Promise.all(insertPromises); // Wait for all insertions
        console.log("All photos inserted successfully.");
    } catch (error) {
        console.error("Error inserting photos:", error);
    }
    db.close(() => console.log("Database connection closed."));
}

async function converToJPG(inputPath) {
    try {
        const inputBuffer = await fs.promises.readFile(inputPath); // Read file correctly
        const outputBuffer = await heicConvert({
            buffer: inputBuffer,
            format: "JPEG",
            quality: 1 // Max quality
        });

        const outputPath = inputPath.replace(/\.heic$/i, ".JPG");
        await fs.promises.writeFile(outputPath, outputBuffer); // Write the converted file
        console.log("Converted:", outputPath);
        return path.basename(outputPath);
    } catch (error) {
        console.log("Error converting to JPG:", error);
        return null;
    }
}

insertAllPhotos("./assets/initial_images");
