import type { Page } from "playwright-core";

export const scrapePage = async (page: Page, numberOfPages: number) => {
  const data: string[] = [];
	for (let i = 1; i <= numberOfPages; i++) {
		const pageData = await getPageData(page);
		data.push(...pageData);
		if (i !== numberOfPages) await navigateToNextPage(page);
	}

  const cleaned = data.filter((entry) => {
		if (entry.includes("Canceled")) return false;
		if (!entry.includes("Levels")) return false;
		return true;
	});

  return cleaned;
}

const getPageData = async (page: Page) => {
  return page.locator(".order-items a").or(page.locator(".product-title")).allInnerTexts();
};

const navigateToNextPage = async (page: Page) => {
  return page.getByText("Next", { exact: true }).first().click()
};

