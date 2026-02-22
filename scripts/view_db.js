const sqlite3 = require('sqlite3');

const dbPath = "photos.db";


async function runDB() {
const db = await new sqlite3.Database(dbPath, (err) => {
    if(err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.')
    }
})

db.all('SELECT * FROM photos', [], (err, rows) => {
    if (err) {
        console.error(err.message);
        return;
    }
    console.log(rows);
});

}

runDB()
