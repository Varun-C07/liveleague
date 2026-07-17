import type { Venue } from "@liveleagues/core/types";

// 16 host venues, keyed by short code used in the schedule tuples.
export const VENUES: Record<string, Venue> = {
  azt: { stadium: "Estadio Azteca", city: "Mexico City", country: "Mexico" },
  akr: { stadium: "Estadio Akron", city: "Guadalajara", country: "Mexico" },
  bbva: { stadium: "Estadio BBVA", city: "Monterrey", country: "Mexico" },
  sofi: { stadium: "SoFi Stadium", city: "Los Angeles", country: "USA" },
  levi: { stadium: "Levi's Stadium", city: "San Francisco Bay", country: "USA" },
  lumen: { stadium: "Lumen Field", city: "Seattle", country: "USA" },
  mb: { stadium: "Mercedes-Benz Stadium", city: "Atlanta", country: "USA" },
  nrg: { stadium: "NRG Stadium", city: "Houston", country: "USA" },
  att: { stadium: "AT&T Stadium", city: "Dallas", country: "USA" },
  arrow: { stadium: "Arrowhead Stadium", city: "Kansas City", country: "USA" },
  hard: { stadium: "Hard Rock Stadium", city: "Miami", country: "USA" },
  met: { stadium: "MetLife Stadium", city: "New York/New Jersey", country: "USA" },
  linc: { stadium: "Lincoln Financial Field", city: "Philadelphia", country: "USA" },
  gill: { stadium: "Gillette Stadium", city: "Boston", country: "USA" },
  bmo: { stadium: "BMO Field", city: "Toronto", country: "Canada" },
  bc: { stadium: "BC Place", city: "Vancouver", country: "Canada" },
};

export function venueOf(key: string): Venue {
  return VENUES[key] ?? { stadium: "TBD", city: "TBD", country: "" };
}
