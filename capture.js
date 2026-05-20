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

  const generatedAt = new Date().toISOString();

  async function addWatermark(
    filename,
    symbol,
    timeframe,
    price,
    timestamp
  ) {

    const displayPrice = price !== null
      ? price
      : 'UNAVAILABLE';

    const svg = `
    <svg width="520" height="165">

      <rect
        width="520"
        height="165"
        fill="black"
        fill-opacity="0.80"
        rx="12"
      />

      <text
        x="18"
        y="35"
        font-size="30"
        fill="white"
        font-family="Arial"
        font-weight="bold"
      >
        TraderCharts
      </text>

      <text
        x="18"
        y="72"
        font-size="26"
        fill="#58a6ff"
        font-family="Arial"
        font-weight="bold"
      >
        ${symbol} ${timeframe}
      </text>

      <text
        x="18"
        y="112"
        font-size="24"
        fill="white"
        font-family="Arial"
      >
        Price: ${displayPrice}
      </text>

      <text
        x="18"
        y="148"
        font-size="20"
        fill="#c9d1d9"
        font-family="Arial"
      >
        Updated: ${timestamp}
      </text>

    </svg>
    `;

    const tempFile = filename + '.tmp.png';

    await sharp(filename)
      .composite([
        {
          input: Buffer.from(svg),
          gravity: 'northwest'
        }
      ])
      .png()
      .toFile(tempFile);

    fs.renameSync(tempFile, filename);

    console.log(`Watermark added to ${filename}`);
  }

  const homepageCharts = [];
  const timestamp = generatedAt
    .replace(/[-:]/g, '')
    .replace('T', '_')
    .split('.')[0];

  for (const chart of charts) {

    console.log(`Loading ${chart.name}...`);

    await page.goto(chart.url, {
      waitUntil: 'domcontentloaded'
    });

    await page.waitForTimeout(10000);

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

      console.log(
        `WARNING: Price extraction failed for ${chart.symbol}`
      );
    }

    if (currentPrice === null) {

      console.log(
        `WARNING: ${chart.symbol} ${chart.timeframe} = UNAVAILABLE`
      );
    } else {

      console.log(
        `${chart.symbol} ${chart.timeframe} price: ${currentPrice}`
      );
    }

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

    const utcStamp =
      new Date()
        .toISOString()
        .replace('T', ' ')
        .slice(0, 16) + ' UTC';

    await addWatermark(
      screenshotPath,
      chart.symbol,
      chart.timeframe,
      currentPrice,
      utcStamp
    );

    homepageCharts.push({
      symbol: chart.symbol,
      timeframe: chart.timeframe,
      image: screenshotPath
    });

    console.log(`Saved ${screenshotPath}`);
  }

  const promptText = `
Open and review these exact URLs:

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

  let chartHtml = '';

  for (let i = 0; i < homepageCharts.length; i += 2) {

    const left = homepageCharts[i];
    const right = homepageCharts[i + 1];

    chartHtml += `
      <div class="row">

        <div class="chart-card">
          <h3>${left.symbol} ${left.timeframe}</h3>
          <img src="${left.image}?t=${timestamp}">
        </div>

        <div class="chart-card">
          <h3>${right.symbol} ${right.timeframe}</h3>
          <img src="${right.image}?t=${timestamp}">
        </div>

      </div>
    `;
  }

  let homepage = `
<!DOCTYPE html>
<html>

<head>

<meta charset="UTF-8">
<title>TraderCharts</title>

<style>

body {
  background:#0d1117;
  color:white;
  font-family:Arial;
  padding:20px;
}

h1 {
  color:#58a6ff;
}

.row {
  display:flex;
  gap:20px;
  margin-bottom:25px;
}

.chart-card {
  flex:1;
  background:#161b22;
  padding:15px;
  border-radius:10px;
}

.chart-card img {
  width:100%;
  border-radius:8px;
}

.chart-card h3 {
  margin-top:0;
}

.prompt-box {
  margin-top:40px;
  background:#161b22;
  border:2px solid #58a6ff;
  padding:20px;
  border-radius:10px;
}

pre {
  background:#0d1117;
  padding:15px;
  border-radius:8px;
  white-space:pre-wrap;
}

</style>

</head>

<body>

<h1>TraderCharts Dashboard</h1>

<p>
Generated:
${generatedAt}
</p>

${chartHtml}

<div class="prompt-box">

<h2>ChatGPT Review Prompt</h2>

<p>
Copy and paste:
</p>

<pre>${promptText}</pre>

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

  console.log('All screenshots complete.');

})();
