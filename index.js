const autobahn = require('autobahn');
const colors = require('colors');
const leftPad = require('left-pad');

const options = {
  url: 'wss://api.poloniex.com',
  historyLength: 20,
  historyPositiveSymbol: '+',
  historyNegativeSymbol: '-',
};

const connection = new autobahn.Connection({
  url: options.url,
  realm: 'realm1'
});

const ethUsdHistory = [];
const ethBtcHistory = [];
const btcUsdHistory = [];
let ethUsdOutput = '';
let ethBtcOutput = '';
let btcUsdOutput = '';
let ethUsdPrevious = false;
let ethBtcPrevious = false;
let btcUsdPrevious = false;

const writeToStdout = (prices) => {
  process.stdout.moveCursor(0, -5);
  process.stdout.cursorTo(0);
  process.stdout.clearScreenDown();
  process.stdout.write('\n');

  // ETH / USD
  if (prices.poloniex.eth.current.usd !== ethUsdPrevious) {
    if (prices.poloniex.eth.change.usd > 0) {
      ethUsdOutput = `${leftPad(prices.poloniex.eth.current.usd, 8)} USD ` + colors.green(`▲ ${prices.poloniex.eth.change.usd}%`);
    } else if (prices.poloniex.eth.change.usd < 0) {
      ethUsdOutput = `${leftPad(prices.poloniex.eth.current.usd, 8)} USD ` + colors.red(`▼ {prices.poloniex.eth.change.usd}%`);
    } else {
      ethUsdOutput = `${leftPad(prices.poloniex.eth.current.usd, 8)} USD ` + `- ${prices.poloniex.eth.change.usd}%`;
    }

    prices.poloniex.eth.current.usd > ethUsdPrevious ? ethUsdHistory.push(colors.green(options.historyPositiveSymbol)) : ethUsdHistory.push(colors.red(options.historyNegativeSymbol));
    ethUsdPrevious = prices.poloniex.eth.current.usd;
  }

  // ETH / BTC
  if (prices.poloniex.eth.current.btc !== ethBtcPrevious) {
    if (prices.poloniex.eth.change.btc > 0) {
      ethBtcOutput = `           \t   \t ${leftPad(prices.poloniex.eth.current.btc, 8)} BTC          `;
    } else if (prices.poloniex.eth.change.btc < 0) {
      ethBtcOutput = `           \t   \t {leftPad(prices.poloniex.eth.current.btc, 8)} BTC          `;
    } else {
      ethBtcOutput = `           \t   \t ${leftPad(prices.poloniex.eth.current.btc, 8)} BTC          `;
    }

    prices.poloniex.eth.current.btc > ethBtcPrevious ? ethBtcHistory.push(colors.green(options.historyPositiveSymbol)) : ethBtcHistory.push(colors.red(options.historyNegativeSymbol));
    ethBtcPrevious = prices.poloniex.eth.current.btc;
  }

  // BTC / USD
  if (prices.poloniex.btc.current.usd !== btcUsdPrevious) {
    if (prices.poloniex.btc.change.usd > 0) {
      btcUsdOutput = `${leftPad(prices.poloniex.btc.current.usd, 8)} USD ` + colors.green(`▲ ${prices.poloniex.btc.change.usd}%`);
    } else if (prices.poloniex.btc.change.usd < 0) {
      btcUsdOutput = `${leftPad(prices.poloniex.btc.current.usd, 8)} USD ` + colors.red(`▼ {prices.poloniex.btc.change.usd}%`);
    } else {
      btcUsdOutput = `${leftPad(prices.poloniex.btc.current.usd, 8)} USD ` + `- ${prices.btc.poloniex.btc.change.usd}%`;
    }

    prices.poloniex.btc.current.usd > btcUsdPrevious ? btcUsdHistory.push(colors.green(options.historyPositiveSymbol)) : btcUsdHistory.push(colors.red(options.historyNegativeSymbol));
    btcUsdPrevious = prices.poloniex.btc.current.usd;
  }

  process.stdout.write(' › Poloniex'.bold.white + '\tETH\t ' + ethUsdOutput + '\t' + ethUsdHistory.slice(options.historyLength * -1).join('') + '\n' + ethBtcOutput + ' ' + ethBtcHistory.slice(options.historyLength * -1).join('') + '\n\n           \tBTC\t ' + btcUsdOutput + '\t' + btcUsdHistory.slice(options.historyLength * -1).join('') + '\n');
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
      prices.poloniex.eth.change.usd = (+data[4] * 100).toFixed(2);
    }

    if (data[0] === 'BTC_ETH') {
      prices.poloniex.eth.current.btc = (+data[1]).toFixed(4).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
      prices.poloniex.eth.change.btc = (+data[4] * 100).toFixed(2);
    }

    if (data[0] === 'USDT_BTC') {
      prices.poloniex.btc.current.usd = (+data[1]).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
      prices.poloniex.btc.change.usd = (+data[4] * 100).toFixed(2);
    }

    writeToStdout(prices);
  });
}

connection.onclose = function () {
  console.log('Socket connection closed');
}

connection.open();
