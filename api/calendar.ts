import type { VercelRequest, VercelResponse } from "@vercel/node";
import ics, { EventAttributes } from "ics";
import playwright from "playwright-aws-lambda";

const locationMap: Record<string, string> = {
	"W ROXBURY":
		"Jim Roche Arena, 1275 VFW Pkwy, West Roxbury, MA 02132",
	"QUINCY (QYA)":
		"Quincy Youth Arena, 60 Murphy Memorial Dr, Quincy, MA 02169",
	SOMERVILLE:
		"Somerville Veteran's Rink, 570 Somerville Ave, Somerville, MA 02143",
	CAMBRIDGE:
		"Simoni Skating Rink, 155 Gore St, Cambridge, MA 02141",
	MILTON: "Ulin Rink, 11 Unquity Rd, Milton, MA 02186",
	BRIGHTON: "Warrior Ice Arena, 90 Guest St, Brighton, MA 02135",
};

const formatGame = (game: string): EventAttributes => {
	const [day, rink, time, level] = game.split(" - ");
	const date = new Date(`${day} ${time}`);

	return {
		title: `StinkySocks ${level}`,
		description: level,
		busyStatus: "BUSY",
		location: locationMap[rink] || rink,
		start: [
			date.getUTCFullYear(),
			date.getUTCMonth() + 1,
			date.getUTCDate(),
			date.getUTCHours(),
			date.getUTCMinutes(),
		],
		startInputType: "utc",
		duration: { minutes: 60 },
	};
};

export default async (req: VercelRequest, res: VercelResponse) => {
	if (!process.env.USERNAME) throw new Error("No username provided");
	if (!process.env.PASSWORD) throw new Error("No password provided");

	const getPageData = async (pageNumber: number) => {
		await page.getByText(`Page ${pageNumber}`).first().waitFor();
		return page.locator(".order-items a").allInnerTexts();
	};

	const navigateToNextPage = async () => {
		return page.getByText("Next", { exact: true }).first().click()
	};

	// known bug: if there are no games, there is no page number, which will throw here
	const getNumberOfPages = async () => {
		const value = await page.getByText("Page 1").first().innerText();
		const match = value.match(/Page 1 of (\d+)/);
		if(!match) throw new Error("no page number found");
		return Number(match[1]);
	}

	const browser = await playwright.launchChromium({
		headless: true,
	});
	const page = await browser.newPage();
	await page.goto(
		"https://secure.stinkysocks.net/myaccount/index.do?merchantId=SSHKY",
	);
	await page.fill("input[id='email']", process.env.USERNAME);
	await page.fill("input[id='password']", process.env.PASSWORD);
	await page.click("input[id='login-button']");
	await page.getByText("Orders", { exact: true }).click();
	const numberOfPages = await getNumberOfPages();

	const data: string[] = [];
	for (let i = 1; i <= numberOfPages; i++) {
		const pageData = await getPageData(i);
		data.push(...pageData);
		if (i !== numberOfPages) await navigateToNextPage();
	}

	const games = data.filter((game) => {
		if (game.includes("Canceled")) return false;
		if (!game.includes("Levels")) return false;
		return true;
	});

	const { value, error } = ics.createEvents(games.map(formatGame));
	if (error) {
		res.status(500);
		res.send(error.message);
		throw error;
	}

	res.setHeader("Content-Type", "text/calendar; charset=utf-8");
	res.setHeader("Content-Disposition", "attachment; filename=stinkysocks.ics");
	res.send(value);

	await browser.close();
};
