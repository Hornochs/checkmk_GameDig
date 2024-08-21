#!/usr/bin/env node
const fs = require('fs');
const csv = require('csv-parser');
const { GameDig } = require('gamedig');

// Absoluter Pfad zur JSON-Datei
const jsonFilePath = '/home/gamienator/servers/servers_results.json';
const csvFilePath = '/home/gamienator/servers/servers.csv';
const results = [];

// Funktion zum Abfragen der Serverdaten
function queryServer(type, host, hostname) {
    return GameDig.query({
        type: type,
        host: host
    })
    .then((state) => {
        return { 
            hostname: hostname,
            ip: host,
            type: type,
            queryResult: state
        };
    })
    .catch((error) => {
        return { 
            hostname: hostname,
            ip: host,
            type: type,
            error: error.message 
        };
    });
}

// CSV-Datei einlesen und Server abfragen
fs.createReadStream(csvFilePath)
    .pipe(csv({ headers: false }))
    .on('data', (row) => {
        const hostname = row[0];
        const ip = row[1];
        const type = row[2];

        results.push(queryServer(type, ip, hostname));
    })
    .on('end', () => {
        // Warte auf alle Abfragen, bevor die Ergebnisse gespeichert werden
        Promise.all(results).then((serverData) => {
            // Speichere die Ergebnisse in der JSON-Datei mit absolutem Pfad
            fs.writeFileSync(jsonFilePath, JSON.stringify(serverData, null, 2));
            console.log(`Die Abfrageergebnisse wurden in "${jsonFilePath}" gespeichert.`);
        });
    });
