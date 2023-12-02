import type { VercelResponse } from "@vercel/node";
import ics from "ics";
import type { Game } from "./data";

export default async function sendICS(games: Game[], res: VercelResponse) {
	const events = games.map((game) => game.event);
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
