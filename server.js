const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

app.get("/search", async (req, res) => {
	const query = req.query.q;
	if (!query) {
		return res.status(400).send('Query parameter "q" is required');
	}

	try {
		const browser = await puppeteer.launch({
			executablePath:
				"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
		});
		const page = await browser.newPage();
		await page.goto(
			`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
		);

		// Wait for the video links to be rendered
		await page.waitForSelector('a[href*="watch?v="]');

		const videoLinks = await page.evaluate(() => {
			const links = Array.from(
				document.querySelectorAll('a[href*="watch?v="]'),
			);
			return links.map((link) => {
				const url = new URL(link.href);
				return {
					url: link.href,
					videoId: url.searchParams.get("v"),
				};
			});
		});

		console.log("Extracted Video Links:", videoLinks);

		await browser.close();

		res.json(videoLinks);
	} catch (error) {
		console.error(error);
		res.status(500).send("Error fetching YouTube search results");
	}
});

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
