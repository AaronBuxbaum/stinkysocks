import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";
import playwright from "playwright-aws-lambda";
import login from "../utils/login.js";
import { scrapePage } from "../utils/navigation.js";
import { formatGame } from "../utils/data.js";

const URGENT_STATUSES = ["FINAL FEW / BOOK NOW", "SOLD OUT - WAITLIST"];

const asyncFilter = async <T>(arr: T[], predicate: (input: T) => Promise<boolean>) => {
	const results = await Promise.all(arr.map(predicate));
	return arr.filter((_, index) => results[index]);
}

const instructions = `To submit a game as waitlisted, send a POST request to this endpoint: https://stinkysocks.vercel.app/api/waitlist with the name of the game in the body.\n
For example: { "data": "SUN 12/3/23 - DORCHESTER - 7:00 PM - Mixed Novice/Lower Intermediate (Levels 2-4)" }`

export const runtime = "edge";
export default async function GET(req: VercelRequest, res: VercelResponse) {
  const browser = await playwright.launchChromium({ headless: true });
  const page = await login(browser);
  await page.goto("https://secure.stinkysocks.net/nch/index.html?level=Novice");
  const data = await scrapePage(page);
  const games = data.map(formatGame).filter((game) => URGENT_STATUSES.includes(game.status));
  const availableGames = await asyncFilter(games, async (game) => {
    if (game.description && await kv.get(game.description)) {
      return false;
    }
    return true;
  });

  res.json({
    finalFew: availableGames.filter((game) => game.status === "FINAL FEW / BOOK NOW").map((game) => game.description),
    waitlist: availableGames.filter((game) => game.status === "SOLD OUT - WAITLIST").map((game) => game.description),
    // instructions,
  });

  await browser.close();
}
