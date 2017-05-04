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
  let ethUsdOuptup;
  let ethBtcOutput;
  let btcUsdOutput;

  process.stdout.moveCursor(0, -5);
  process.stdout.cursorTo(0);
  process.stdout.clearScreenDown();
  process.stdout.write('\n');

  // ETH / USD
  if (prices.poloniex.eth.change.usd > 0) {
    ethUsdOutput = `${prices.poloniex.eth.current.usd} USD ` + colors.green(`\t▲ ${prices.poloniex.eth.change.usd}%`);
  } else if (prices.poloniex.eth.change.usd < 0) {
    ethUsdOutput = `${prices.poloniex.eth.current.usd} USD ` + colors.red(`\t▼ {prices.poloniex.eth.change.usd}%`);
  } else {
    ethUsdOutput = `${prices.poloniex.eth.current.usd} USD ` + `\t- ${prices.poloniex.eth.change.usd}%`;
  }

  // ETH / BTC
  if (prices.poloniex.eth.change.btc > 0) {
    ethBtcOutput = `\t\t\t${prices.poloniex.eth.current.btc} BTC ` + colors.green(`\t▲ ${prices.poloniex.eth.change.btc}%`);
  } else if (prices.poloniex.eth.change.btc < 0) {
    ethBtcOutput = `\t\t\t${prices.poloniex.eth.current.btc} BTC ` + colors.red(`\t▼ {prices.poloniex.eth.change.btc}%`);
  } else {
    ethBtcOutput = `\t\t\t${prices.poloniex.eth.current.btc} BTC ` + `\t- ${prices.poloniex.eth.change.btc}%`;
  }

  // BTC / USD
  if (prices.poloniex.btc.change.usd > 0) {
    btcUsdOutput = `${prices.poloniex.btc.current.usd} USD ` + colors.green(`\t▲ ${prices.poloniex.btc.change.usd}%`);
  } else if (prices.poloniex.btc.change.usd < 0) {
    btcUsdOutput = `${prices.poloniex.btc.current.usd} USD ` + colors.red(`\t▼ {prices.poloniex.btc.change.usd}%`);
  } else {
    btcUsdOutput = `${prices.poloniex.btc.current.usd} USD ` + `\t- ${prices.btc.poloniex.btc.change.usd}%`;
  }

  process.stdout.write(' › Poloniex'.bold.white + '\tETH\t ' + ethUsdOutput + '\n' + ethBtcOutput + '\n\n\t\tBTC\t' + btcUsdOutput);
};

process.stdout.write('\n');

connection.onopen = (session) => {
  const prices = {
    poloniex: {
      eth: {
        current: {
          usd: '00.00',
          btc: '0.0000'
        },
        change: {
          usd: '0.00',
          btc: '0.0000'
        }
      },
      btc: {
        current: {
          usd: '0000.00'
        },
        change: {
          usd: '0.00'
        }
      }
    }
  };

  session.subscribe('ticker', (data) => {
    if (data[0] === 'USDT_ETH') {
      prices.poloniex.eth.current.usd = (+data[1]).toFixed(2);
      prices.poloniex.eth.change.usd = (+data[4]).toFixed(2);
    }

    if (data[0] === 'BTC_ETH') {
      prices.poloniex.eth.current.btc = (+data[1]).toFixed(4);
      prices.poloniex.eth.change.btc = (+data[4]).toFixed(2);
    }

    if (data[0] === 'USDT_BTC') {
      prices.poloniex.btc.current.usd = (+data[1]).toFixed(2);
      prices.poloniex.btc.change.usd = (+data[4]).toFixed(2);
    }

    writeToStdout(prices);
  });
}

connection.onclose = function () {
  console.log('Socket connection closed');
}

connection.open();
