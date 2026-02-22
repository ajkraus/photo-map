const path = require('path');

module.exports = {
    entry: {
        main: './src/main/main.js', // Your Electron main process file
        preload: './src/main/preload.js' // Ensures preload.js stays separate
    },
    target: 'electron-main', // Ensures correct target
    output: {
        filename: '[name].js', // Keeps main.js and preload.js separate
        path: __dirname + '/dist'
    }
};

