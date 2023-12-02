import type { EventAttributes } from "ics";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(utc);

const locationMap: Record<string, string> = {
  ANDOVER: "Phillips Academy Ice Rink, 254 S Main St, Andover, MA 01810",
  BRIGHTON: "Warrior Ice Arena, 90 Guest St, Brighton, MA 02135",
  BURLINGTON: "Burlington Ice Palace, 36 Ray Ave, Burlington, MA 01803",
  CAMBRIDGE: "Simoni Skating Rink, 155 Gore St, Cambridge, MA 02141",
  CHELMSFORD: "Chelmsford Forum, 2 Brick Kiln Rd, North Billerica, MA 01862",
  DORCHESTER: "Devine Rink, 995 William T Morrissey Blvd, Dorchester, MA 02122",
  EVERETT: "Allied Veterans Memorial Rink, 65 Elm St, Everett, MA 02149",
  MARLBORO: "Navin Arena, 451 Bolton St, Marlborough, MA 01752",
  MEDFORD: "LoConte Memorial Rink, 97 Locust St, Medford, MA 02155",
  MILTON: "Ulin Rink, 11 Unquity Rd, Milton, MA 02186",
  NATICK: "William L. Chase Arena, 35 Windsor Ave, Natick, MA 01760",
  "NORTH END": "Steriti Memorial Rink, 561 Commercial St, Boston, MA 02109",
  "QUINCY (QYA)": "Quincy Youth Arena, 60 Murphy Memorial Dr, Quincy, MA 02169",
  REVERE: "Cronin Memorial Rink, 850 Revere Beach Pkwy, Revere, MA 02151",
  "S BOSTON": "Murphy Memorial Rink, 1880 William J Day Blvd, Boston, MA 02127",
  SOMERVILLE: "Veteran's Memorial Rink, 570 Somerville Ave, Somerville, MA 02143",
  "W ROXBURY": "Jim Roche Arena, 1275 VFW Pkwy, West Roxbury, MA 02132",
};

export interface Game {
  description: string;
  status: string;
  date: dayjs.Dayjs;
  event: EventAttributes;
}

export const formatGame = (game: string): Game => {
  const [description, status] = game.split("\n");
  const [day, rink, time, level] = description.split(" - ");
  const date = dayjs(`${day} ${time} EST`).utc();

  if (!locationMap[rink]) {
    console.log(`No location found for ${rink}! Proceeding...`)
  }

  const event: EventAttributes = {
    title: "Hockey",
    description: `StinkySocks: ${level}`,
    busyStatus: "BUSY",
    location: locationMap[rink] || rink,
    start: [
      date.year(),
      date.month() + 1,
      date.date(),
      date.hour(),
      date.minute(),
    ],
    startInputType: "utc",
    startOutputType: "utc",
    duration: { minutes: 60 },
    uid: description,
  };

  return {
    event,
    date,
    description,
    status,
  }
};
