// F1 2026 calendar + verified offline snapshot (podiums through Round 7,
// 14 Jun 2026), ported from the original static board. `utc` is race start.

export type F1Driver = { code: string; color: string };
export type F1Round = {
  n: number;
  gp: string;
  circuit: string;
  loc: string;
  ctry: string;
  day: string;
  utc: string;
  sprint: boolean;
  podium: [F1Driver, F1Driver, F1Driver] | null;
};

// Constructor colors (Jolpica constructorId -> hex).
export const CONSTRUCTOR_COLORS: Record<string, string> = {
  mercedes: "#27e7c8",
  ferrari: "#e8002d",
  red_bull: "#3b7bf0",
  mclaren: "#ff8000",
  alpine: "#1aa9e8",
  aston_martin: "#2d9b78",
  williams: "#4bb8ff",
  rb: "#6c8cff",
  racing_bulls: "#6c8cff",
  haas: "#b6babd",
  audi: "#16c79a",
  cadillac: "#d6b56b",
  sauber: "#2bd576",
};

export function colorForConstructor(id: string | undefined): string {
  return (id && CONSTRUCTOR_COLORS[id]) || "#8a909e";
}

// shorthand team colors used by the baked podium snapshot
const MER = "#27e7c8";
const FER = "#e8002d";
const MCL = "#ff8000";
const RBR = "#3b7bf0";
const ALP = "#1aa9e8";
const d = (code: string, color: string): F1Driver => ({ code, color });

export const F1_SCHEDULE: F1Round[] = [
  { n: 1, gp: "Australian GP", circuit: "Albert Park, Melbourne", loc: "Melbourne", ctry: "Australia", day: "Sun, Mar 8", utc: "2026-03-08T04:00:00Z", sprint: false, podium: [d("RUS", MER), d("ANT", MER), d("LEC", FER)] },
  { n: 2, gp: "Chinese GP", circuit: "Shanghai Int'l Circuit", loc: "Shanghai", ctry: "China", day: "Sun, Mar 15", utc: "2026-03-15T07:00:00Z", sprint: true, podium: [d("ANT", MER), d("RUS", MER), d("HAM", FER)] },
  { n: 3, gp: "Japanese GP", circuit: "Suzuka Circuit", loc: "Suzuka", ctry: "Japan", day: "Sun, Mar 29", utc: "2026-03-29T05:00:00Z", sprint: false, podium: [d("ANT", MER), d("PIA", MCL), d("LEC", FER)] },
  { n: 4, gp: "Miami GP", circuit: "Miami Int'l Autodrome", loc: "Miami", ctry: "USA", day: "Sun, May 3", utc: "2026-05-03T20:00:00Z", sprint: true, podium: [d("ANT", MER), d("NOR", MCL), d("PIA", MCL)] },
  { n: 5, gp: "Canadian GP", circuit: "Circuit Gilles Villeneuve", loc: "Montréal", ctry: "Canada", day: "Sun, May 24", utc: "2026-05-24T20:00:00Z", sprint: true, podium: [d("ANT", MER), d("HAM", FER), d("VER", RBR)] },
  { n: 6, gp: "Monaco GP", circuit: "Circuit de Monaco", loc: "Monte Carlo", ctry: "Monaco", day: "Sun, Jun 7", utc: "2026-06-07T13:00:00Z", sprint: false, podium: [d("ANT", MER), d("HAM", FER), d("GAS", ALP)] },
  { n: 7, gp: "Spanish GP", circuit: "Barcelona-Catalunya", loc: "Barcelona", ctry: "Spain", day: "Sun, Jun 14", utc: "2026-06-14T13:00:00Z", sprint: false, podium: [d("HAM", FER), d("RUS", MER), d("NOR", MCL)] },
  { n: 8, gp: "Austrian GP", circuit: "Red Bull Ring", loc: "Spielberg", ctry: "Austria", day: "Sun, Jun 28", utc: "2026-06-28T13:00:00Z", sprint: false, podium: null },
  { n: 9, gp: "British GP", circuit: "Silverstone", loc: "Silverstone", ctry: "UK", day: "Sun, Jul 5", utc: "2026-07-05T14:00:00Z", sprint: true, podium: null },
  { n: 10, gp: "Belgian GP", circuit: "Spa-Francorchamps", loc: "Spa", ctry: "Belgium", day: "Sun, Jul 19", utc: "2026-07-19T13:00:00Z", sprint: false, podium: null },
  { n: 11, gp: "Hungarian GP", circuit: "Hungaroring", loc: "Budapest", ctry: "Hungary", day: "Sun, Jul 26", utc: "2026-07-26T13:00:00Z", sprint: false, podium: null },
  { n: 12, gp: "Dutch GP", circuit: "Zandvoort", loc: "Zandvoort", ctry: "Netherlands", day: "Sun, Aug 23", utc: "2026-08-23T13:00:00Z", sprint: true, podium: null },
  { n: 13, gp: "Italian GP", circuit: "Monza", loc: "Monza", ctry: "Italy", day: "Sun, Sep 6", utc: "2026-09-06T13:00:00Z", sprint: false, podium: null },
  { n: 14, gp: "Spanish GP — Madrid", circuit: "Madring (Madrid)", loc: "Madrid", ctry: "Spain", day: "Sun, Sep 13", utc: "2026-09-13T13:00:00Z", sprint: false, podium: null },
  { n: 15, gp: "Azerbaijan GP", circuit: "Baku City Circuit", loc: "Baku", ctry: "Azerbaijan", day: "Sat, Sep 26", utc: "2026-09-26T11:00:00Z", sprint: false, podium: null },
  { n: 16, gp: "Singapore GP", circuit: "Marina Bay", loc: "Singapore", ctry: "Singapore", day: "Sun, Oct 11", utc: "2026-10-11T12:00:00Z", sprint: true, podium: null },
  { n: 17, gp: "United States GP", circuit: "Circuit of the Americas", loc: "Austin", ctry: "USA", day: "Sun, Oct 25", utc: "2026-10-25T20:00:00Z", sprint: false, podium: null },
  { n: 18, gp: "Mexico City GP", circuit: "Autódromo H. Rodríguez", loc: "Mexico City", ctry: "Mexico", day: "Sun, Nov 1", utc: "2026-11-01T20:00:00Z", sprint: false, podium: null },
  { n: 19, gp: "São Paulo GP", circuit: "Interlagos", loc: "São Paulo", ctry: "Brazil", day: "Sun, Nov 8", utc: "2026-11-08T17:00:00Z", sprint: false, podium: null },
  { n: 20, gp: "Las Vegas GP", circuit: "Las Vegas Strip Circuit", loc: "Las Vegas", ctry: "USA", day: "Sat, Nov 21", utc: "2026-11-22T04:00:00Z", sprint: false, podium: null },
  { n: 21, gp: "Qatar GP", circuit: "Lusail Int'l Circuit", loc: "Lusail", ctry: "Qatar", day: "Sun, Nov 29", utc: "2026-11-29T16:00:00Z", sprint: false, podium: null },
  { n: 22, gp: "Abu Dhabi GP", circuit: "Yas Marina Circuit", loc: "Abu Dhabi", ctry: "UAE", day: "Sun, Dec 6", utc: "2026-12-06T13:00:00Z", sprint: false, podium: null },
];
