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

export async function GET() {
	const browser = await playwright.launchChromium({ headless: true });
	const page = await login(browser);
	await page.getByText("Orders", { exact: true }).click();
	const data = await scrapePage(page);
	await browser.close();
	const games = data.map(formatGame);
	await Promise.all(games.map(cacheGame));
	return sendICS(games);
};
