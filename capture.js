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

  // BUILD dashboard.png (2-column stitched image)

  const scale = 2;

  const imgWidth = 1600 * scale;
  const imgHeight = 820 * scale;
  const cols = 2;
  const rows = Math.ceil(homepageCharts.length / cols);

  const composites = [];

  for (let i = 0; i < homepageCharts.length; i++) {

    const col = i % cols;
    const row = Math.floor(i / cols);

    composites.push({
      input: await sharp(
        homepageCharts[i].image
      )
      .resize(
        1600 * scale,
        820 * scale
      )
      .toBuffer()

      left: col * (1600 * scale),
      top: row * (820 * scale)
    });
  }

  const dashboardWidth = cols * imgWidth;
  const dashboardHeight = rows * imgHeight;

  await sharp({
    create: {
      width: dashboardWidth,
      height: dashboardHeight,
      channels: 3,
      background: '#0d1117'
    }
  })
    .composite(composites)
    .png()
    .toFile('dashboard.png');

  console.log('Saved dashboard.png');

  // BUILD HOMEPAGE

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
  text-align:center;
}

h1 {
  color:#58a6ff;
}

.generated {
  color:#c9d1d9;
  margin-bottom:25px;
}

.dashboard {
  width:100%;
  max-width:3200px;
  border-radius:12px;
  box-shadow:0 0 20px rgba(0,0,0,0.35);
}

.copy-btn {

  margin-top:35px;
  background:#238636;
  color:white;
  border:none;
  padding:16px 32px;
  border-radius:10px;
  font-size:20px;
  font-weight:bold;
  cursor:pointer;
}

.copy-btn:hover {
  background:#2ea043;
}

</style>

</head>

<body>

<h1>TraderCharts Dashboard</h1>

<p class="generated">
Generated:
${generatedAt}
</p>

<img
  class="dashboard"
  src="dashboard.png?t=${timestamp}"
>

<br>

<button
  class="copy-btn"
  onclick="copyDashboard()"
>
Copy Dashboard
</button>

<script>

async function copyDashboard() {

  try {

    const response = await fetch(
      'dashboard.png?t=${timestamp}'
    );

    const blob = await response.blob();

    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob
      })
    ]);

    alert(
      'Dashboard copied to clipboard.'
    );

  } catch (err) {

    console.error(err);

    alert(
      'Copy failed. Browser may not support image clipboard access.'
    );
  }
}

</script>

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
