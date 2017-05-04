const autobahn = require('autobahn');
const colors = require('colors');
const leftPad = require('left-pad');

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
    ethUsdOutput = `${leftPad(prices.poloniex.eth.current.usd, 8)} USD ` + colors.green(`▲ ${prices.poloniex.eth.change.usd}%`);
  } else if (prices.poloniex.eth.change.usd < 0) {
    ethUsdOutput = `${leftPad(prices.poloniex.eth.current.usd, 8)} USD ` + colors.red(`▼ {prices.poloniex.eth.change.usd}%`);
  } else {
    ethUsdOutput = `${leftPad(prices.poloniex.eth.current.usd, 8)} USD ` + `- ${prices.poloniex.eth.change.usd}%`;
  }

  // ETH / BTC
  if (prices.poloniex.eth.change.btc > 0) {
    ethBtcOutput = `           \t   \t ${leftPad(prices.poloniex.eth.current.btc, 8)} BTC ` + colors.green(`▲ ${prices.poloniex.eth.change.usd}%`);
  } else if (prices.poloniex.eth.change.btc < 0) {
    ethBtcOutput = `           \t   \t {leftPad(prices.poloniex.eth.current.btc, 8)} BTC ` + colors.red(`▼ {prices.poloniex.eth.change.btc}%`);
  } else {
    ethBtcOutput = `           \t   \t ${leftPad(prices.poloniex.eth.current.btc, 8)} BTC ` + `- ${prices.poloniex.eth.change.btc}%`;
  }

  // BTC / USD
  if (prices.poloniex.btc.change.usd > 0) {
    btcUsdOutput = `${leftPad(prices.poloniex.btc.current.usd, 8)} USD ` + colors.green(`▲ ${prices.poloniex.btc.change.usd}%`);
  } else if (prices.poloniex.btc.change.usd < 0) {
    btcUsdOutput = `${leftPad(prices.poloniex.btc.current.usd, 8)} USD ` + colors.red(`▼ {prices.poloniex.btc.change.usd}%`);
  } else {
    btcUsdOutput = `${leftPad(prices.poloniex.btc.current.usd, 8)} USD ` + `- ${prices.btc.poloniex.btc.change.usd}%`;
  }

  process.stdout.write(' › Poloniex'.bold.white + '\tETH\t ' + ethUsdOutput + '\n' + ethBtcOutput + '\n\n           \tBTC\t ' + btcUsdOutput + '\n');
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
          btc: '0.00'
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
      prices.poloniex.eth.current.usd = (+data[1]).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
      prices.poloniex.eth.change.usd = (+data[4]).toFixed(2);
    }

    if (data[0] === 'BTC_ETH') {
      prices.poloniex.eth.current.btc = (+data[1]).toFixed(4).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
      prices.poloniex.eth.change.btc = (+data[4]).toFixed(2);
    }

    if (data[0] === 'USDT_BTC') {
      prices.poloniex.btc.current.usd = (+data[1]).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
      prices.poloniex.btc.change.usd = (+data[4]).toFixed(2);
    }

    writeToStdout(prices);
  });
}

connection.onclose = function () {
  console.log('Socket connection closed');
}

connection.open();
