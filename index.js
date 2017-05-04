const autobahn = require('autobahn');
const colors = require('colors');

const options = {
  url: 'wss://api.poloniex.com'
};

const connection = new autobahn.Connection({
  url: options.url,
  realm: 'realm1'
});

const writeToStdout = (prices) => {
  let usdOutput;
  let btcOutput;

  process.stdout.clearLine();
  process.stdout.cursorTo(0);

  // ETH / USD
  if (prices.poloniex.change.usd > 0) {
    usdOutput = `${prices.poloniex.current.usd} USD ` + colors.green(`▲ ${prices.poloniex.change.usd}%`);
  } else if (prices.poloniex.change.usd < 0) {
    usdOutput = `${prices.poloniex.current.usd} USD ` + colors.red(`▼ {prices.poloniex.change.usd}%`);
  } else {
    usdOutput = `${prices.poloniex.current.usd} USD ` + `${prices.poloniex.change.usd}%`;
  }

  // ETH / BTC
  if (prices.poloniex.change.btc > 0) {
    btcOutput = `${prices.poloniex.current.btc} BTC ` + colors.green(`▲ ${prices.poloniex.change.btc}%`);
  } else if (prices.poloniex.change.btc < 0) {
    btcOutput = `${prices.poloniex.current.btc} BTC ` + colors.red(`▼ {prices.poloniex.change.btc}%`);
  } else {
    btcOutput = `${prices.poloniex.current.btc} BTC ` + `${prices.poloniex.change.btc}%`;
  }

  process.stdout.write(' › Poloniex'.bold.white + '\tETH\t '.white + usdOutput + '\t' + btcOutput);
};

connection.onopen = (session) => {
  const prices = {
    poloniex: {
      current: {
        usd: '00.00',
        btc: '0.0000'
      },
      change: {
        usd: '0.00',
        btc: '0.0000'
      }
    }
  };

  session.subscribe('ticker', (data) => {
    if (data[0] === 'USDT_ETH') {
      prices.poloniex.current.usd = (+data[1]).toFixed(2);
      prices.poloniex.change.usd = (+data[4]).toFixed(2);
    }

    if (data[0] === 'BTC_ETH') {
      prices.poloniex.current.btc = (+data[1]).toFixed(4);
      prices.poloniex.change.btc = (+data[4]).toFixed(2);
    }

    writeToStdout(prices);
  });
}

connection.onclose = function () {
  console.log('Socket connection closed');
}

connection.open();
