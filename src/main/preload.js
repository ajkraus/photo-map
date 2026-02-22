// preload.js
const {contextBridge, ipcRenderer} = require("electron");

console.log("Loaded")
contextBridge.exposeInMainWorld("api", {
    getAllImages: () => ipcRenderer.invoke("getAllImages"),
    uploadPhoto: () => ipcRenderer.invoke("uploadPhoto"),
    insertPhoto: (data) => ipcRenderer.invoke("insertPhoto", data),
    removePhoto: (id) => ipcRenderer.invoke("removePhoto", id),
    getUserDataPath: (filename) => ipcRenderer.invoke("getUserDataPath", filename),
    getMapTilerKey: () => process.env.MAPTILER_API_KEY
});

