# checkmk_GameDig

Node Program to query all Game Servers and create piggyback results for CheckMK

In Addition a HTML Page will be generated to show server status of all servers und add an connect button to steam games

Install:

- copy `index.js` to folder 
- Install necessary npm packages `npm install gamedig csv-parser fs`
- create `servers.csv` file like dist
- copy `gameserver_test.py` to `/usr/lib/check_mk_agent/local` and make it executeable
- update folder patches