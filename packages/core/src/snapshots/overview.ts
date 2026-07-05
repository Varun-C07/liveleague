// AUTO-GENERATED bundled fallback — a frozen LiveOverview captured from /api so the
// mobile app opens instantly and survives a backend outage (degrades to this,
// never blank). Replaced by live data on the first successful fetch. Regenerate
// by re-capturing the /api response and re-running the sanitizer. Do not hand-edit.
import type { LiveOverview } from "../sports/types";

export const OVERVIEW_SNAPSHOT: LiveOverview = {
  "syncedAt": "2026-07-05T23:03:01.690Z",
  "totalLive": 0,
  "sports": [
    {
      "id": "f1",
      "name": "Formula 1",
      "short": "F1",
      "blurb": "Every round of the 2026 calendar — podiums & championship, live.",
      "emoji": "🏎️",
      "accent": "#ff2a2a",
      "accentVar": "--accent-f1",
      "basePath": "/f1",
      "competitionLabel": "Grand Prix",
      "source": "snapshot",
      "reason": "sample",
      "syncedAt": "2026-07-05T22:18:53.469+00:00",
      "liveCount": 0,
      "total": 22,
      "topGames": [
        {
          "id": "f1-10",
          "utc": "2026-07-19T13:00:00Z",
          "away": {
            "code": "",
            "name": "",
            "real": false,
            "color": "#ff2a2a",
            "score": null
          },
          "city": "Spa",
          "home": {
            "code": "R10",
            "name": "Belgian GP",
            "real": true,
            "color": "#ff2a2a",
            "score": null
          },
          "extra": {
            "round": 10,
            "sport": "f1",
            "podium": null,
            "sprint": false,
            "circuit": "Spa-Francorchamps"
          },
          "label": "Round 10",
          "sport": "f1",
          "venue": "Spa-Francorchamps",
          "approx": false,
          "status": "sched",
          "country": "Belgium"
        },
        {
          "id": "f1-11",
          "utc": "2026-07-26T13:00:00Z",
          "away": {
            "code": "",
            "name": "",
            "real": false,
            "color": "#ff2a2a",
            "score": null
          },
          "city": "Budapest",
          "home": {
            "code": "R11",
            "name": "Hungarian GP",
            "real": true,
            "color": "#ff2a2a",
            "score": null
          },
          "extra": {
            "round": 11,
            "sport": "f1",
            "podium": null,
            "sprint": false,
            "circuit": "Hungaroring"
          },
          "label": "Round 11",
          "sport": "f1",
          "venue": "Hungaroring",
          "approx": false,
          "status": "sched",
          "country": "Hungary"
        },
        {
          "id": "f1-12",
          "utc": "2026-08-23T13:00:00Z",
          "away": {
            "code": "",
            "name": "",
            "real": false,
            "color": "#ff2a2a",
            "score": null
          },
          "city": "Zandvoort",
          "home": {
            "code": "R12",
            "name": "Dutch GP",
            "real": true,
            "color": "#ff2a2a",
            "score": null
          },
          "extra": {
            "round": 12,
            "sport": "f1",
            "podium": null,
            "sprint": true,
            "circuit": "Zandvoort"
          },
          "label": "Round 12 · Sprint",
          "sport": "f1",
          "venue": "Zandvoort",
          "approx": false,
          "status": "sched",
          "country": "Netherlands"
        }
      ]
    },
    {
      "id": "soccer",
      "name": "World Cup",
      "short": "FIFA",
      "blurb": "All 104 matches of the 2026 World Cup with live group tables.",
      "emoji": "⚽",
      "accent": "#16c060",
      "accentVar": "--accent-soccer",
      "basePath": "/soccer",
      "competitionLabel": "Match",
      "source": "snapshot",
      "reason": "sample",
      "syncedAt": "2026-07-05T23:03:01.690Z",
      "liveCount": 0,
      "total": 104,
      "topGames": [
        {
          "id": "soccer-87",
          "sport": "soccer",
          "status": "sched",
          "utc": "2026-07-03T23:00:00Z",
          "approx": true,
          "venue": "Arrowhead Stadium",
          "city": "Kansas City",
          "country": "USA",
          "home": {
            "code": "1K",
            "name": "1K",
            "logo": "",
            "color": "#5b6b60",
            "score": null,
            "real": false
          },
          "away": {
            "code": "3rd D/E/I/J/L",
            "name": "3rd D/E/I/J/L",
            "logo": "",
            "color": "#5b6b60",
            "score": null,
            "real": false
          },
          "label": "R32",
          "extra": {
            "sport": "soccer",
            "grp": null,
            "minute": null,
            "stage": "R32"
          }
        },
        {
          "id": "soccer-92",
          "sport": "soccer",
          "status": "sched",
          "utc": "2026-07-06T00:00Z",
          "approx": false,
          "venue": "Estadio Banorte",
          "city": "Mexico City",
          "country": "Mexico",
          "home": {
            "code": "MEX",
            "name": "Mexico",
            "logo": "🇲🇽",
            "color": "#0a8f4e",
            "score": null,
            "real": true
          },
          "away": {
            "code": "ENG",
            "name": "England",
            "logo": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
            "color": "#cdd2d8",
            "score": null,
            "real": true
          },
          "label": "R16",
          "extra": {
            "sport": "soccer",
            "grp": null,
            "minute": null,
            "stage": "R16"
          }
        },
        {
          "id": "soccer-93",
          "sport": "soccer",
          "status": "sched",
          "utc": "2026-07-06T19:00Z",
          "approx": false,
          "venue": "AT&T Stadium",
          "city": "Dallas",
          "country": "USA",
          "home": {
            "code": "POR",
            "name": "Portugal",
            "logo": "🇵🇹",
            "color": "#1aa84a",
            "score": null,
            "real": true
          },
          "away": {
            "code": "ESP",
            "name": "Spain",
            "logo": "🇪🇸",
            "color": "#c60b1e",
            "score": null,
            "real": true
          },
          "label": "R16",
          "extra": {
            "sport": "soccer",
            "grp": null,
            "minute": null,
            "stage": "R16"
          }
        }
      ]
    },
    {
      "id": "nba",
      "name": "NBA",
      "short": "NBA",
      "blurb": "Live NBA scores — quarter, clock and the night's slate.",
      "emoji": "🏀",
      "accent": "#ff7a18",
      "accentVar": "--accent-nba",
      "basePath": "/nba",
      "competitionLabel": "Game",
      "source": "snapshot",
      "reason": "sample",
      "syncedAt": "2026-07-05T23:03:01.487Z",
      "liveCount": 0,
      "total": 1,
      "topGames": [
        {
          "id": "nba-401859967",
          "sport": "nba",
          "status": "final",
          "utc": "2026-06-14T00:30Z",
          "approx": false,
          "venue": "Frost Bank Center",
          "city": "San Antonio",
          "country": "TX",
          "home": {
            "code": "SA",
            "name": "Spurs",
            "logoUrl": "https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/sa.png",
            "color": "#000000",
            "score": 90,
            "real": true
          },
          "away": {
            "code": "NY",
            "name": "Knicks",
            "logoUrl": "https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/ny.png",
            "color": "#1d428a",
            "score": 94,
            "real": true
          },
          "label": "Final",
          "extra": {
            "sport": "nba",
            "period": "Final",
            "clock": null
          }
        }
      ]
    },
    {
      "id": "cricket",
      "name": "Cricket",
      "short": "CRIC",
      "blurb": "Live international & league cricket — innings, overs, run rate.",
      "emoji": "🏏",
      "accent": "#19c7a0",
      "accentVar": "--accent-cricket",
      "basePath": "/cricket",
      "competitionLabel": "Match",
      "source": "snapshot",
      "reason": "sample",
      "syncedAt": "2026-07-05T23:03:01.485Z",
      "liveCount": 0,
      "total": 3,
      "topGames": [
        {
          "id": "cricket-snap-2",
          "sport": "cricket",
          "status": "sched",
          "utc": "2026-06-15T04:00:00Z",
          "approx": false,
          "venue": "MCG",
          "city": "Melbourne",
          "country": "AUS",
          "home": {
            "code": "AUS",
            "name": "Australia",
            "color": "#f4c430",
            "score": null,
            "real": true
          },
          "away": {
            "code": "NZ",
            "name": "New Zealand",
            "color": "#0a0a0a",
            "score": null,
            "real": true
          },
          "label": "T20I",
          "extra": {
            "sport": "cricket",
            "innings": null,
            "overs": null,
            "note": null
          }
        },
        {
          "id": "cricket-snap-3",
          "sport": "cricket",
          "status": "sched",
          "utc": "2026-06-16T09:30:00Z",
          "approx": false,
          "venue": "Newlands",
          "city": "Cape Town",
          "country": "RSA",
          "home": {
            "code": "SA",
            "name": "South Africa",
            "color": "#157f3b",
            "score": null,
            "real": true
          },
          "away": {
            "code": "PAK",
            "name": "Pakistan",
            "color": "#01411c",
            "score": null,
            "real": true
          },
          "label": "Test · Day 1",
          "extra": {
            "sport": "cricket",
            "innings": null,
            "overs": null,
            "note": null
          }
        },
        {
          "id": "cricket-snap-1",
          "sport": "cricket",
          "status": "final",
          "utc": "2026-06-13T09:30:00Z",
          "approx": false,
          "venue": "Lord's",
          "city": "London",
          "country": "ENG",
          "home": {
            "code": "IND",
            "name": "India",
            "color": "#1f6feb",
            "score": 287,
            "real": true
          },
          "away": {
            "code": "ENG",
            "name": "England",
            "color": "#cf2b34",
            "score": 261,
            "real": true
          },
          "label": "ODI · Result",
          "extra": {
            "sport": "cricket",
            "innings": "2nd",
            "overs": "48.2",
            "note": "India won by 26 runs"
          }
        }
      ]
    },
    {
      "id": "baseball",
      "name": "MLB",
      "short": "MLB",
      "blurb": "Live MLB scores — inning, base state and the day's games.",
      "emoji": "⚾",
      "accent": "#4b8bff",
      "accentVar": "--accent-baseball",
      "basePath": "/baseball",
      "competitionLabel": "Game",
      "source": "snapshot",
      "reason": "sample",
      "syncedAt": "2026-07-05T23:03:01.487Z",
      "liveCount": 0,
      "total": 15,
      "topGames": [
        {
          "id": "baseball-401816041",
          "sport": "baseball",
          "status": "final",
          "utc": "2026-07-05T20:30Z",
          "approx": false,
          "venue": "Sutter Health Park",
          "city": "Sacramento",
          "country": "California",
          "home": {
            "code": "ATH",
            "name": "Athletics",
            "logoUrl": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/ath.png",
            "color": "#003831",
            "score": 0,
            "real": true
          },
          "away": {
            "code": "MIA",
            "name": "Marlins",
            "logoUrl": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/mia.png",
            "color": "#00a3e0",
            "score": 8,
            "real": true
          },
          "label": "Top 8th",
          "extra": {
            "sport": "baseball",
            "inning": "8",
            "half": "top",
            "outs": 2
          }
        },
        {
          "id": "baseball-401816044",
          "sport": "baseball",
          "status": "final",
          "utc": "2026-07-05T21:00Z",
          "approx": false,
          "venue": "T-Mobile Park",
          "city": "Seattle",
          "country": "Washington",
          "home": {
            "code": "SEA",
            "name": "Mariners",
            "logoUrl": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/sea.png",
            "color": "#005c5c",
            "score": 3,
            "real": true
          },
          "away": {
            "code": "TOR",
            "name": "Blue Jays",
            "logoUrl": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/tor.png",
            "color": "#134a8e",
            "score": 0,
            "real": true
          },
          "label": "Bot 8th",
          "extra": {
            "sport": "baseball",
            "inning": "8",
            "half": "bot",
            "outs": 1
          }
        },
        {
          "id": "baseball-401816043",
          "sport": "baseball",
          "status": "sched",
          "utc": "2026-07-05T23:20Z",
          "approx": false,
          "venue": "Dodger Stadium",
          "city": "Los Angeles",
          "country": "California",
          "home": {
            "code": "LAD",
            "name": "Dodgers",
            "logoUrl": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/lad.png",
            "color": "#005a9c",
            "score": null,
            "real": true
          },
          "away": {
            "code": "SD",
            "name": "Padres",
            "logoUrl": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/sd.png",
            "color": "#2f241d",
            "score": null,
            "real": true
          },
          "label": "7/5 - 7:20 PM EDT",
          "extra": {
            "sport": "baseball",
            "inning": null,
            "half": null,
            "outs": null
          }
        },
        {
          "id": "baseball-401816040",
          "sport": "baseball",
          "status": "sched",
          "utc": "2026-07-06T01:30Z",
          "approx": false,
          "venue": "Angel Stadium",
          "city": "Anaheim",
          "country": "California",
          "home": {
            "code": "LAA",
            "name": "Angels",
            "logoUrl": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/laa.png",
            "color": "#ba0021",
            "score": null,
            "real": true
          },
          "away": {
            "code": "BOS",
            "name": "Red Sox",
            "logoUrl": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/bos.png",
            "color": "#0d2b56",
            "score": null,
            "real": true
          },
          "label": "7/5 - 9:30 PM EDT",
          "extra": {
            "sport": "baseball",
            "inning": null,
            "half": null,
            "outs": null
          }
        },
        {
          "id": "baseball-401816039",
          "sport": "baseball",
          "status": "final",
          "utc": "2026-07-05T20:00Z",
          "approx": false,
          "venue": "Coors Field",
          "city": "Denver",
          "country": "Colorado",
          "home": {
            "code": "COL",
            "name": "Rockies",
            "logoUrl": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/col.png",
            "color": "#33006f",
            "score": 7,
            "real": true
          },
          "away": {
            "code": "SF",
            "name": "Giants",
            "logoUrl": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/sf.png",
            "color": "#000000",
            "score": 6,
            "real": true
          },
          "label": "Final",
          "extra": {
            "sport": "baseball",
            "inning": null,
            "half": null,
            "outs": null
          }
        }
      ]
    }
  ]
};
