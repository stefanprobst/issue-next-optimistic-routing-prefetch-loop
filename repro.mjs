// Starts `next start`, opens a page, and counts the RSC requests the browser sends in the following three seconds,
// grouped by URL and `Next-Router-Segment-Prefetch` header. Both pages render the same two links, to `/en` and `/de`.

import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { chromium } from "playwright";

const port = 3288;
const base = `http://localhost:${port}`;

const server = spawn("node_modules/.bin/next", ["start", "-p", String(port)], { stdio: "ignore" });

try {
	await waitForServer();

	const browser = await chromium.launch();
	console.log(`chromium ${browser.version()}\n`);

	for (const pathname of ["/en", "/de", "/x"]) {
		const page = await browser.newPage();
		const counts = new Map();
		page.on("request", (request) => {
			const headers = request.headers();
			if (headers.rsc !== "1") return;
			const key = `${new URL(request.url()).pathname} \`${headers["next-router-segment-prefetch"] ?? "-"}\``;
			counts.set(key, (counts.get(key) ?? 0) + 1);
		});
		await page.goto(base + pathname);
		await sleep(3000);
		await page.close();

		console.log(`### ${pathname}\n`);
		console.log("| RSC request | segment | count |");
		console.log("| --- | --- | --- |");
		for (const [key, count] of [...counts].sort((a, b) => b[1] - a[1])) {
			const [url, segment] = key.split(" ");
			console.log(`| ${url} | ${segment} | ${count} |`);
		}
		console.log();
	}

	await browser.close();
} finally {
	server.kill();
}

async function waitForServer() {
	for (let i = 0; i < 100; i++) {
		try {
			await fetch(base);
			return;
		} catch {
			await sleep(100);
		}
	}
	throw new Error("server did not start");
}
