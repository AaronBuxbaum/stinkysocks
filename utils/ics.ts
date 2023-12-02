import type { VercelResponse } from "@vercel/node";
import ics, { EventAttributes } from "ics";

export default async function sendICS(events: EventAttributes[], res: VercelResponse) {
  const { value, error } = ics.createEvents(events);
	if (error) {
		res.status(500);
		res.send(error.message);
		throw error;
	}

	res.setHeader("Content-Type", "text/calendar; charset=utf-8");
	res.setHeader("Content-Disposition", "attachment; filename=stinkysocks.ics");
	res.send(value);
}
