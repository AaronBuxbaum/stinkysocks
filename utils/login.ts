import type { ChromiumBrowser } from "playwright-core";

export default async function login(browser: ChromiumBrowser) {
  if (!process.env.USERNAME) throw new Error("No username provided");
	if (!process.env.PASSWORD) throw new Error("No password provided");

  const page = await browser.newPage();
	await page.goto(
		"https://secure.stinkysocks.net/myaccount/index.do?merchantId=SSHKY",
	);
	await page.fill("input[id='email']", process.env.USERNAME);
	await page.fill("input[id='password']", process.env.PASSWORD);
	await page.click("input[id='login-button']");
  return page;
}
