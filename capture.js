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

  for (const chart of charts) {

    console.log(`Loading ${chart.name}...`);

    await page.goto(chart.url, {
      waitUntil: 'domcontentloaded'
    });

    // Allow chart + indicators to fully render
    await page.waitForTimeout(10000);

    // Save chart screenshot
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

// Extract current price from body text

const bodyText = await page.locator('body').innerText();

let currentPrice = null;

try {

  // Find line after "C"

  const lines = bodyText.split('\n');

  const cIndex = lines.indexOf('C');

  if (cIndex !== -1 && lines[cIndex + 1]) {

    currentPrice = parseFloat(
      lines[cIndex + 1].replace(/,/g, '')
    );
  }

} catch (err) {

  console.log(`Could not extract price for ${chart.symbol}`);
}


    // Generate JSON metadata

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
  }

  await context.close();

  console.log('All screenshots and metadata complete.');

})();
