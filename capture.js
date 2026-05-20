const { chromium } = require('playwright');
const fs = require('fs');
const sharp = require('sharp');


(async () => {

  const context = await chromium.launchPersistentContext('./userdata', {
    headless: true,
    viewport: {
      width: 1600,
      height: 900
    }
  });

  const page = await context.newPage();

  const charts = [
    {
      name: 'eurusd_5m',
      symbol: 'EURUSD',
      timeframe: '5m',
      url: 'https://www.tradingview.com/chart/?symbol=FX:EURUSD&interval=5'
    },
    {
      name: 'eurusd_15m',
      symbol: 'EURUSD',
      timeframe: '15m',
      url: 'https://www.tradingview.com/chart/?symbol=FX:EURUSD&interval=15'
    },
    {
      name: 'gbpusd_5m',
      symbol: 'GBPUSD',
      timeframe: '5m',
      url: 'https://www.tradingview.com/chart/?symbol=FX:GBPUSD&interval=5'
    },
    {
      name: 'gbpusd_15m',
      symbol: 'GBPUSD',
      timeframe: '15m',
      url: 'https://www.tradingview.com/chart/?symbol=FX:GBPUSD&interval=15'
    },
    {
      name: 'usdjpy_5m',
      symbol: 'USDJPY',
      timeframe: '5m',
      url: 'https://www.tradingview.com/chart/?symbol=FX:USDJPY&interval=5'
    },
    {
      name: 'usdjpy_15m',
      symbol: 'USDJPY',
      timeframe: '15m',
      url: 'https://www.tradingview.com/chart/?symbol=FX:USDJPY&interval=15'
    },
    {
      name: 'btcusd_5m',
      symbol: 'BTCUSD',
      timeframe: '5m',
      url: 'https://www.tradingview.com/chart/?symbol=BITSTAMP:BTCUSD&interval=5'
    },
    {
      name: 'btcusd_15m',
      symbol: 'BTCUSD',
      timeframe: '15m',
      url: 'https://www.tradingview.com/chart/?symbol=BITSTAMP:BTCUSD&interval=15'
    },
    {
      name: 'xauusd_5m',
      symbol: 'XAUUSD',
      timeframe: '5m',
      url: 'https://www.tradingview.com/chart/?symbol=OANDA:XAUUSD&interval=5'
    },
    {
      name: 'xauusd_15m',
      symbol: 'XAUUSD',
      timeframe: '15m',
      url: 'https://www.tradingview.com/chart/?symbol=OANDA:XAUUSD&interval=15'
    }
  ];

  const latestData = {
    generated_at: new Date().toISOString(),
    charts: {}
  };


async function addTimestampWatermark(filename, timestamp) {

  const svg = `
  <svg width="450" height="90">
    <rect
      width="450"
      height="90"
      fill="black"
      fill-opacity="0.75"
    />
    <text
      x="15"
      y="35"
      font-size="26"
      fill="white"
      font-family="sans-serif"
      font-weight="bold"
    >
      TraderCharts
    </text>
    <text
      x="15"
      y="70"
      font-size="22"
      fill="#58a6ff"
      font-family="sans-serif"
    >
      ${timestamp}
    </text>
  </svg>
  `;

  const tempFile = filename + ".tmp";

  await sharp(filename)
    .composite([
      {
        input: Buffer.from(svg),
        gravity: 'northwest'
      }
    ])
    .png()
    .toFile(tempFile);

  const fs = require('fs');

  fs.renameSync(tempFile, filename);

  console.log(`Watermark added to ${filename}`);
}

  for (const chart of charts) {

    console.log(`Loading ${chart.name}...`);

    await page.goto(chart.url, {
      waitUntil: 'domcontentloaded'
    });

    await page.waitForTimeout(10000);

    // Screenshot
const screenshotPath = `${chart.name}.png`;

await page.screenshot({
  path: screenshotPath,
  clip: {
    x: 0,
    y: 80,
    width: 1600,
    height: 820
  }
});

await addTimestampWatermark(
  screenshotPath,
  new Date().toISOString().replace('T',' ').slice(0,16) + ' UTC'
);

console.log(`Saved ${screenshotPath}`);


    // Extract price

    const bodyText = await page.locator('body').innerText();

    let currentPrice = null;

    try {

      const closeMatch = bodyText.match(
        /C\s+([0-9,.]+)/
      );

      if (closeMatch && closeMatch[1]) {

        currentPrice = parseFloat(
          closeMatch[1].replace(/,/g, '')
        );
      }

    } catch (err) {

      console.log(`Could not extract price for ${chart.symbol}`);
    }

    // Per-chart JSON

    const metadata = {
      symbol: chart.symbol,
      timeframe: chart.timeframe,
      current_price: currentPrice,
      screenshot: `${chart.name}.png`,
      updated_at: new Date().toISOString()
    };

    fs.writeFileSync(
      `${chart.name}.json`,
      JSON.stringify(metadata, null, 2)
    );

    console.log(`Saved ${chart.name}.json`);

    latestData.charts[chart.name] = {
      symbol: chart.symbol,
      timeframe: chart.timeframe,
      current_price: currentPrice,
      image: `https://www.tradercharts.xyz/${chart.name}.png`,
      updated_at: metadata.updated_at
    };
  }

  // latest.json

  fs.writeFileSync(
    'latest.json',
    JSON.stringify(latestData, null, 2)
  );

  console.log('Saved latest.json');

  // INDEX.HTML = AI HOMEPAGE

const timestamp = latestData.generated_at
  .replace(/[-:]/g, '')
  .replace('T', '_')
  .split('.')[0];

const promptText = `
Open and review these exact URLs:

https://www.tradercharts.xyz/latest.json?t=${timestamp}
https://www.tradercharts.xyz/eurusd_5m.png?t=${timestamp}
https://www.tradercharts.xyz/eurusd_15m.png?t=${timestamp}
https://www.tradercharts.xyz/gbpusd_5m.png?t=${timestamp}
https://www.tradercharts.xyz/gbpusd_15m.png?t=${timestamp}
https://www.tradercharts.xyz/usdjpy_5m.png?t=${timestamp}
https://www.tradercharts.xyz/usdjpy_15m.png?t=${timestamp}
https://www.tradercharts.xyz/btcusd_5m.png?t=${timestamp}
https://www.tradercharts.xyz/btcusd_15m.png?t=${timestamp}
https://www.tradercharts.xyz/xauusd_5m.png?t=${timestamp}
https://www.tradercharts.xyz/xauusd_15m.png?t=${timestamp}
`;

let homepage = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>TraderCharts AI Feed</title>

<style>

body {
  background:#0d1117;
  color:white;
  font-family:Arial;
  padding:20px;
}

pre {
  background:#161b22;
  padding:15px;
  border-radius:8px;
  white-space:pre-wrap;
}

.prompt-box {
  margin-top:40px;
  background:#161b22;
  border:2px solid #58a6ff;
  padding:20px;
  border-radius:10px;
}

h2 {
  color:#58a6ff;
}

</style>
</head>

<body>

<h1>TraderCharts AI Feed</h1>

<p>
Generated:
${latestData.generated_at}
</p>

<pre>
${JSON.stringify(latestData, null, 2)}
</pre>

<div class="prompt-box">

<h2>ChatGPT Review Prompt</h2>

<p>
Copy and paste this prompt:
</p>

<pre>
${promptText}
</pre>

</div>

</body>
</html>
`;

  fs.writeFileSync(
    'index.html',
    homepage
  );

  console.log('Saved index.html');

  await context.close();

  console.log('All screenshots and metadata complete.');

})();
