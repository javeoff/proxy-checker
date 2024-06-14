import { existsSync } from "fs";

if (!existsSync('proxies.txt')) {
	throw new Error('Create a file with proxies')
}

async function main() {
	const proxiesText = await Bun.file("proxies.txt").text();
	const proxies = proxiesText.split("\n").filter((x) => !!x)
	let durations: number[] = []

	const requests: { status: boolean }[] = await Promise.all(proxies.map(async (proxy, idx) => {
		const date = Date.now();
		const res = await Promise.race([
			new Promise((r) => setTimeout(r, 10000)),
			fetch('https://api64.ipify.org?format=json', { proxy: 'http://' + proxy })
		]).catch(() => {
			return;
		})
		if (!res) {
			return {
				status: false,
			}
		}
		const duration = (Date.now() - date) / 1000;
		durations[idx] = duration;
		console.log(`[${idx}] ${proxy} - ${duration}s`)
		return res;
	}))
	const responses = requests.map((t, idx) => ({
		proxy: proxies[idx],
		status: t.status,
		duration: durations[idx],
	})
	)
	console.log('Proxies updated')
	Bun.write('filteredProxies.txt', responses.filter((r) => r.status).map((r) => r.proxy).join('\n'))
}

main()
