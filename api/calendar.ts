import type { VercelRequest, VercelResponse } from "@vercel/node";
import playwright from "playwright-aws-lambda";
import login from "../utils/login.js";
import sendICS from "../utils/ics.js";
import { scrapePage } from "../utils/navigation.js";
import { Game, formatGame } from "../utils/data.js";
import { kv } from "@vercel/kv";

const cacheGame = async (game: Game) => {
	if (!game.description) return;
	await kv.set(game.description, "scheduled");
}

export default async (req: VercelRequest, res: VercelResponse) => {
	const browser = await playwright.launchChromium({ headless: true });
	const page = await login(browser);
	await page.getByText("Orders", { exact: true }).click();
	const data = await scrapePage(page);
	const games = data.map(formatGame);
	await Promise.all(games.map(cacheGame));
	sendICS(games, res);
	await browser.close();
};
