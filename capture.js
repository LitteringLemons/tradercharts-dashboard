const { chromium } = require('playwright');

(async () => {

  const context = await chromium.launchPersistentContext('./userdata', {
    headless: true,
    viewport: {
      width: 1600,
      height: 900
    }
  });

  const page = await context.newPage();

  // List of charts to capture
const charts = [
  {
    name: 'eurusd_5m',
    url: 'https://www.tradingview.com/chart/?symbol=FX:EURUSD&interval=5'
  },
  {
    name: 'eurusd_15m',
    url: 'https://www.tradingview.com/chart/?symbol=FX:EURUSD&interval=15'
  },
  {
    name: 'gbpusd_5m',
    url: 'https://www.tradingview.com/chart/?symbol=FX:GBPUSD&interval=5'
  },
  {
    name: 'gbpusd_15m',
    url: 'https://www.tradingview.com/chart/?symbol=FX:GBPUSD&interval=15'
  },
  {
    name: 'usdjpy_5m',
    url: 'https://www.tradingview.com/chart/?symbol=FX:USDJPY&interval=5'
  },
  {
    name: 'usdjpy_15m',
    url: 'https://www.tradingview.com/chart/?symbol=FX:USDJPY&interval=15'
  },
  {
    name: 'btcusd_5m',
    url: 'https://www.tradingview.com/chart/?symbol=BITSTAMP:BTCUSD&interval=5'
  },
  {
    name: 'btcusd_15m',
    url: 'https://www.tradingview.com/chart/?symbol=BITSTAMP:BTCUSD&interval=15'
  },
  {
    name: 'xauusd_5m',
    url: 'https://www.tradingview.com/chart/?symbol=OANDA:XAUUSD&interval=5'
  },
  {
    name: 'xauusd_15m',
    url: 'https://www.tradingview.com/chart/?symbol=OANDA:XAUUSD&interval=15'
  }
];
  for (const chart of charts) {

    console.log(`Loading ${chart.name}...`);

    await page.goto(chart.url, {
      waitUntil: 'domcontentloaded'
    });

    // Allow chart + indicators time to fully render
    await page.waitForTimeout(10000);

    // Capture cleaner chart-focused screenshot
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
  }

  await context.close();

  console.log('All screenshots complete.');

})();
