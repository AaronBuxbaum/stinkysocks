import type { VercelRequest, VercelResponse } from "@vercel/node";
import playwright from "playwright-aws-lambda";
import login from "../utils/login.js";
import sendICS from "../utils/ics.js";
import { scrapePage } from "../utils/navigation.js";
import type { Page } from "playwright-core";
import { formatGame } from "../utils/data.js";

// known bug: if there are no games, there is no page number, which will throw here
const getNumberOfPages = async (page: Page) => {
  const value = await page.getByText("Page 1").first().innerText();
  const match = value.match(/Page 1 of (\d+)/);
  if (!match) throw new Error("no page number found");
  return Number(match[1]);
}

export default async (req: VercelRequest, res: VercelResponse) => {
	const browser = await playwright.launchChromium({ headless: true });
	const page = await login(browser);
	await page.getByText("Orders", { exact: true }).click();
	const numberOfPages = await getNumberOfPages(page);
	const games = await scrapePage(page, numberOfPages);
	sendICS(games.map(formatGame), res);
	await browser.close();
};
