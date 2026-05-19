const { chromium } = require('playwright');
const fs = require('fs');

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

  for (const chart of charts) {

    console.log(`Loading ${chart.name}...`);

    await page.goto(chart.url, {
      waitUntil: 'domcontentloaded'
    });

    await page.waitForTimeout(10000);

    // Screenshot

    await page.screenshot({
      path: `${chart.name}.png`,
      clip: {
        x: 0,
        y: 80,
        width: 1600,
        height: 820
      }
    });

    console.log(`Saved ${chart.name}.png`);

    // Extract current price

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

    // Add to latest.json

    latestData.charts[chart.name] = {
      symbol: chart.symbol,
      timeframe: chart.timeframe,
      current_price: currentPrice,
      image: `https://www.tradercharts.xyz/${chart.name}.png`,
      metadata: `https://www.tradercharts.xyz/${chart.name}.json`,
      updated_at: metadata.updated_at
    };
  }

  // Save latest.json

  fs.writeFileSync(
    'latest.json',
    JSON.stringify(latestData, null, 2)
  );

  console.log('Saved latest.json');

  // Build STATIC latest.html

  let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>TraderCharts Latest</title>

<style>

body {
  background:#0d1117;
  color:white;
  font-family:Arial;
  padding:20px;
}

h1 {
  margin-bottom:20px;
}

pre {
  background:#161b22;
  padding:15px;
  border-radius:8px;
  overflow:auto;
  white-space:pre-wrap;
}

a {
  color:#58a6ff;
}

</style>
</head>

<body>

<h1>TraderCharts Latest Metadata</h1>

<p>
Generated:
${latestData.generated_at}
</p>

<pre>
${JSON.stringify(latestData, null, 2)}
</pre>

</body>
</html>
`;

  fs.writeFileSync(
    'latest.html',
    html
  );

  console.log('Saved latest.html');

  await context.close();

  console.log('All screenshots and metadata complete.');

})();
