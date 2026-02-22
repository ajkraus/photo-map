const heicConvert = require('heic-convert');
const fs = require('fs').promises; // Use Promises API
const path = require('path');

async function converToJPG(inputPath) {
    try {
        const inputBuffer = await fs.readFile(inputPath); // Read file correctly
        const outputBuffer = await heicConvert({
            buffer: inputBuffer,
            format: "JPEG",
            quality: 1 // Max quality
        });

        const outputPath = inputPath.replace(/\.heic$/i, ".jpg");
        await fs.writeFile(outputPath, outputBuffer); // Write the converted file
        console.log("Converted:", outputPath);
        return outputPath;
    } catch (error) {
        console.log("Error converting to JPG:", error);
        return null;
    }
}

function isHEIC(filePath) {
    return filePath.toLowerCase().endsWith(".heic");
}

// Read the directory and convert HEIC files
async function convertAllHEIC() {
    try {
        const dir = "assets/initial_images";
        const files = await fs.readdir(dir); // Read files asynchronously
        for (const file of files) {
            if (isHEIC(file)) {
                const fullPath = path.join(dir, file); // Ensure full file path
                await converToJPG(fullPath); // Convert file
            }
        }
    } catch (error) {
        console.error("Error reading directory:", error);
    }
}

// Run the conversion
convertAllHEIC();
