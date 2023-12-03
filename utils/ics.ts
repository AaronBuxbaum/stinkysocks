import ics from "ics";
import type { Game } from "./data.js";

export default async function sendICS(games: Game[]) {
	const events = games.map((game) => game.event);
  const { value, error } = ics.createEvents(events);
	if (error) {
		return Response.json({ error: error.message }, { status: 500 });
	}

	return Response.json(value, {
		headers: {
			"Content-Type": "text/calendar; charset=utf-8",
			"Content-Disposition": "attachment; filename=stinkysocks.ics",
		},
	});
}
