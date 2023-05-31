import type { VercelRequest, VercelResponse } from "@vercel/node";
import chromium from "chrome-aws-lambda";
import ics, { EventAttributes } from "ics";
import playwright from "playwright-core";

const locationMap: Record<string, string> = {
	"W ROXBURY":
		"Jim Roche Arena, 1275 VFW Pkwy, West Roxbury, MA 02132, United States",
	"QUINCY (QYA)":
		"Quincy Youth Arena, 60 Murphy Memorial Dr, Quincy, MA  02169, United States",
	SOMERVILLE:
		"Somerville Veteran's Rink, 570 Somerville Ave, Somerville, MA  02143, United States",
	CAMBRIDGE:
		"Simoni Skating Rink, 155 Gore St, Cambridge, MA  02141, United States",
	MILTON: "Ulin Rink, 11 Unquity Rd, Milton, MA  02186, United States",
	BRIGHTON: "Warrior Ice Arena, 90 Guest St, Brighton, MA 02135, United States",
};

const formatGame = (game: string): EventAttributes => {
	const [day, rink, time, level] = game.split(" - ");
	const date = new Date(`${day} ${time}`);

	return {
		title: `StinkySocks ${level}`,
		description: level,
		busyStatus: "FREE",
		location: locationMap[rink] || rink,
		start: [
			date.getUTCFullYear(),
			date.getUTCMonth(),
			date.getUTCDate(),
			date.getUTCHours(),
			date.getUTCMinutes(),
		],
		duration: { minutes: 60 },
	};
};

export default async (req: VercelRequest, res: VercelResponse) => {
	if (!process.env.USERNAME) throw new Error("No username provided");
	if (!process.env.PASSWORD) throw new Error("No password provided");

	const getPage = async (count: number) => {
		if (count !== 1) {
			await page.getByText("Next", { exact: true }).first().click();
		}
		await page.getByText(`Page ${count}`).first().waitFor();
		return page.locator(".order-items a").allInnerTexts();
	};

	const browser = await playwright.chromium.launch({
		args: chromium.args,
		executablePath: (await chromium.executablePath) || undefined,
		headless: true,
	});
	const page = await browser.newPage();
	await page.goto(
		"https://secure.stinkysocks.net/myaccount/index.do?merchantId=SSHKY",
	);
	await page.type("input[id='email']", process.env.USERNAME);
	await page.type("input[id='password']", process.env.PASSWORD);
	await page.click("input[id='login-button']");
	await page.getByText("Orders", { exact: true }).click();

	const data: string[] = [];
	for (let i = 1; i <= 3; i++) {
		const pageData = await getPage(i);
		data.push(...pageData);
	}

	const games = data.filter((game) => {
		if (game.includes("Canceled")) return false;
		if (!game.includes("Levels")) return false;
		return true;
	});

	const { value, error } = ics.createEvents(games.map(formatGame));
	if (error) throw error;

	res.setHeader("Content-Type", "text/calendar; charset=utf-8");
	res.setHeader("Content-Disposition", "attachment; filename=stinkysocks.ics");
	res.send(value);

	await browser.close();
};
