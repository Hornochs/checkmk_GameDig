#!/usr/bin/env node
const fs = require('fs');
const csv = require('csv-parser');
const { GameDig } = require('gamedig');

// Pfade zu den Dateien
const jsonFilePath = '/home/stephanschaffner/servers/servers_results.json';
const csvFilePath = '/home/stephanschaffner/servers/servers.csv';
const outputFilePath = '/var/www/html/game_servers.html';

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

// HTML-Inhalt generieren
function generateHTML(serverData) {
    let htmlContent = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Game Server Übersicht</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
        <style>
            .circle {
                width: 15px;
                height: 15px;
                border-radius: 50%;
                display: inline-block;
                margin-right: 10px;
            }
            .green-circle {
                background-color: green;
            }
            .red-circle {
                background-color: red;
            }
            .btn-connect {
                background-color: green;
                color: white;
            }
        </style>
    </head>
    <body>
        <div class="container mt-5">
            <h1 class="mb-4">Game Server Übersicht</h1>
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Status</th>
                        <th>Spielname</th>
                        <th>Protokoll</th>
                        <th>Spieleranzahl</th>
                        <th>Details</th>
                        <th>Connect</th>
                    </tr>
                </thead>
                <tbody>
    `;

    serverData.forEach((server, idx) => {
        if (server.error) {
            const ip = server.ip || 'N/A';
            const gameType = server.type || 'N/A';

            htmlContent += `
            <tr>
                <td><span class="circle red-circle"></span></td>
                <td>${ip}</td>
                <td>${gameType}</td>
                <td></td>
                <td>
                    <button class="btn btn-primary btn-sm" type="button" data-bs-toggle="collapse" data-bs-target="#details-${idx}" aria-expanded="false" aria-controls="details-${idx}">
                        Details
                    </button>
                </td>
                <td></td>
            </tr>
            <tr id="details-${idx}" class="collapse">
                <td colspan="6">
                    <strong>Status:</strong> Offline <br>
                    <strong>IP Adresse:</strong> ${ip} <br>
                    <strong>Protokoll:</strong> ${gameType}
                </td>
            </tr>
            `;
        } else {
            const queryResult = server.queryResult || {};
            const name = queryResult.name || 'N/A';
            const numplayers = queryResult.numplayers || 0;
            const maxplayers = queryResult.maxplayers || 0;
            const gameType = server.type || 'N/A';
            const ip = server.ip || 'N/A';
            const mapName = queryResult.map || 'N/A';
            const queryPort = queryResult.queryPort || 'N/A';
            const hasSteamId = 'steamid' in (queryResult.raw || {});

            htmlContent += `
            <tr>
                <td><span class="circle green-circle"></span></td>
                <td>${name}</td>
                <td>${gameType}</td>
                <td>${numplayers} / ${maxplayers}</td>
                <td>
                    <button class="btn btn-primary btn-sm" type="button" data-bs-toggle="collapse" data-bs-target="#details-${idx}" aria-expanded="false" aria-controls="details-${idx}">
                        Details
                    </button>
                </td>
            `;

            if (hasSteamId) {
                const connectLink = `steam://connect/${ip}:${queryPort}`;
                htmlContent += `
                <td>
                    <a href="${connectLink}" class="btn btn-connect btn-sm">Connect</a>
                </td>
                `;
            } else {
                htmlContent += '<td></td>';
            }

            htmlContent += `
            </tr>
            <tr id="details-${idx}" class="collapse">
                <td colspan="6">
                    <strong>IP Adresse:</strong> ${ip} <br>
                    <strong>Map:</strong> ${mapName}
                </td>
            </tr>
            `;
        }
    });

    htmlContent += `
                </tbody>
            </table>
        </div>
    </body>
    </html>
    `;

    // Speichere das HTML in der Datei
    fs.writeFileSync(outputFilePath, htmlContent, 'utf-8');
    console.log(`Die HTML-Datei wurde unter "${outputFilePath}" erstellt.`);
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
            // Speichere die Ergebnisse in der JSON-Datei
            fs.writeFileSync(jsonFilePath, JSON.stringify(serverData, null, 2));
            console.log(`Die Abfrageergebnisse wurden in "${jsonFilePath}" gespeichert.`);

            // Generiere und speichere die HTML-Datei
            generateHTML(serverData);
        });
    });
