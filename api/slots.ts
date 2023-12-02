import type { VercelRequest, VercelResponse } from "@vercel/node";
import playwright from "playwright-aws-lambda";
import login from "../utils/login.js";
import { scrapePage } from "../utils/navigation.js";
import { formatGame } from "../utils/data.js";
import sendICS from "../utils/ics.js";

export default async (req: VercelRequest, res: VercelResponse) => {
  const browser = await playwright.launchChromium({ headless: true });
	const page = await login(browser);
  await page.goto("https://secure.stinkysocks.net/nch/index.html?level=Novice&listingsperpage=100");
  const numberOfPages = await page.locator('div[class="page-numbers"]').first().locator('a').count();
  const data = await scrapePage(page, numberOfPages);
	sendICS(data.map(formatGame), res);
  await browser.close();
}
