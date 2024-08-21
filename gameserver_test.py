#!/usr/bin/env python3
import json

# Pfad zur JSON-Datei
json_file_path = '/home/gamienator/servers/servers_results.json'

# JSON-Daten einlesen
with open(json_file_path, 'r') as file:
    servers = json.load(file)

# Funktion zur Berechnung von Warn- und Kritischen Werten
def calculate_thresholds(maxplayers):
    warn = int(maxplayers * 0.8)
    crit = int(maxplayers * 0.9)
    return warn, crit

# Funktion zur Erstellung des Local Check-Ausgabeformats
def create_checkmk_output(server):
    hostname = server['hostname']
    servicename = "Gameserver"  # Servicename ist immer "Gameserver"
    
    # Prüfen, ob ein Fehler aufgetreten ist
    if 'error' in server:
        # Fehlerhafte Server-Ausgabe
        output = f"<<<<{hostname}>>>>\n"
        output += "<<<local>>>\n"
        output += f'2 "{servicename}" - Serverquery war erfolglos!\n'
        output += "<<<<>>>>\n"
    else:
        # Erfolgreiche Server-Abfrage
        query_result = server['queryResult']
        numplayers = query_result['numplayers']
        maxplayers = query_result['maxplayers']
        ping = query_result['ping']

        # Berechnung der Warn- und Kritischen Schwellenwerte für numplayers
        warn_players, crit_players = calculate_thresholds(maxplayers)
        warn_ping = 20
        crit_ping = 50

        # Local Check-Ausgabe für CheckMK
        output = f"<<<<{hostname}>>>>\n"
        output += "<<<local>>>\n"
        
        # Service für die Spieleranzahl und den Ping, getrennt durch eine Pipe
        output += f'P "{servicename}" numplayers={numplayers};{warn_players};{crit_players};0;{maxplayers}|'
        output += f'ping={ping};{warn_ping};{crit_ping};0;100 '
        
        # Custom Text
        output += "Performancedaten Gameserver\n"
        output += "<<<<>>>>\n"

    return output

# Ausgabe generieren für alle Server
for server in servers:
    print(create_checkmk_output(server))
