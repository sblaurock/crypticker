const autobahn = require('autobahn');
const colors = require('colors');
const leftPad = require('left-pad');

const options = {
  url: 'wss://api.poloniex.com',
  history: {
    enabled: true,
    length: 20,
    positiveSymbol: '➚',
    negativeSymbol: '➘',
    minimumDelay: 5 * 1000 // 5 seconds
  }
};

const connection = new autobahn.Connection({
  url: options.url,
  realm: 'realm1'
});

const exchanges = {
  ethUsd: {
    history: [],
    output: '',
    previous: 0,
    updated: 0
  },
  ethBtc: {
    history: [],
    output: '',
    previous: 0,
    updated: 0
  },
  btcUsd: {
    history: [],
    output: '',
    previous: 0,
    updated: 0
  }
};

const writeToStdout = (prices) => {
  process.stdout.moveCursor(0, -5);
  process.stdout.cursorTo(0);
  process.stdout.clearScreenDown();
  process.stdout.write('\n');

  // ETH / USD
  if (prices.poloniex.eth.current.usd !== exchanges.ethUsd.previous) {
    if (prices.poloniex.eth.change.usd > 0) {
      exchanges.ethUsd.output = `${leftPad(prices.poloniex.eth.current.usd, 8)} USD ` + colors.green(`▲ ${prices.poloniex.eth.change.usd}%`);
    } else if (prices.poloniex.eth.change.usd < 0) {
      exchanges.ethUsd.output = `${leftPad(prices.poloniex.eth.current.usd, 8)} USD ` + colors.red(`▼ {prices.poloniex.eth.change.usd}%`);
    } else {
      exchanges.ethUsd.output = `${leftPad(prices.poloniex.eth.current.usd, 8)} USD ` + `- ${prices.poloniex.eth.change.usd}%`;
    }

    // Ensure updates cannot happen faster than `n` seconds
    if (options.history.enabled && +(prices.poloniex.eth.current.usd.replace(',', '')) && exchanges.ethUsd.updated + options.history.minimumDelay < (+ new Date())) {
      prices.poloniex.eth.current.usd > exchanges.ethUsd.previous ? exchanges.ethUsd.history.push(colors.green(options.history.positiveSymbol)) : exchanges.ethUsd.history.push(colors.red(options.history.negativeSymbol));
      exchanges.ethUsd.updated = (+ new Date());
    }

    exchanges.ethUsd.previous = prices.poloniex.eth.current.usd;
  }

  // ETH / BTC
  if (prices.poloniex.eth.current.btc !== exchanges.ethBtc.previous) {
    if (prices.poloniex.eth.change.btc > 0) {
      exchanges.ethBtc.output = `           \t   \t ${leftPad(prices.poloniex.eth.current.btc, 8)} BTC          `;
    } else if (prices.poloniex.eth.change.btc < 0) {
      exchanges.ethBtc.output = `           \t   \t {leftPad(prices.poloniex.eth.current.btc, 8)} BTC          `;
    } else {
      exchanges.ethBtc.output = `           \t   \t ${leftPad(prices.poloniex.eth.current.btc, 8)} BTC          `;
    }

    // Ensure updates cannot happen faster than `n` seconds
    if (options.history.enabled && +(prices.poloniex.eth.current.btc.replace(',', '')) && exchanges.ethBtc.updated + options.history.minimumDelay < (+ new Date())) {
      prices.poloniex.eth.current.btc > exchanges.ethBtc.previous ? exchanges.ethBtc.history.push(colors.green(options.history.positiveSymbol)) : exchanges.ethBtc.history.push(colors.red(options.history.negativeSymbol));
      exchanges.ethBtc.updated = (+ new Date());
    }

    exchanges.ethBtc.previous = prices.poloniex.eth.current.btc;
  }

  // BTC / USD
  if (prices.poloniex.btc.current.usd !== exchanges.btcUsd.previous) {
    if (prices.poloniex.btc.change.usd > 0) {
      exchanges.btcUsd.output = `${leftPad(prices.poloniex.btc.current.usd, 8)} USD ` + colors.green(`▲ ${prices.poloniex.btc.change.usd}%`);
    } else if (prices.poloniex.btc.change.usd < 0) {
      exchanges.btcUsd.output = `${leftPad(prices.poloniex.btc.current.usd, 8)} USD ` + colors.red(`▼ {prices.poloniex.btc.change.usd}%`);
    } else {
      exchanges.btcUsd.output = `${leftPad(prices.poloniex.btc.current.usd, 8)} USD ` + `- ${prices.btc.poloniex.btc.change.usd}%`;
    }

    // Ensure updates cannot happen faster than `n` seconds
    if (options.history.enabled && +(prices.poloniex.btc.current.usd.replace(',', '')) && exchanges.btcUsd.updated + options.history.minimumDelay < (+ new Date())) {
      prices.poloniex.btc.current.usd > exchanges.btcUsd.previous ? exchanges.btcUsd.history.push(colors.green(options.history.positiveSymbol)) : exchanges.btcUsd.history.push(colors.red(options.history.negativeSymbol));
      exchanges.btcUsd.updated = (+ new Date());
    }

    exchanges.btcUsd.previous = prices.poloniex.btc.current.usd;
  }

  process.stdout.write(' › Poloniex'.bold.white + '\tETH\t ' + exchanges.ethUsd.output + '\t' + exchanges.ethUsd.history.slice(options.history.length * -1).join('') + '\n' + exchanges.ethBtc.output + ' ' + exchanges.ethBtc.history.slice(options.history.length * -1).join('') + '\n\n           \tBTC\t ' + exchanges.btcUsd.output + '\t' + exchanges.btcUsd.history.slice(options.history.length * -1).join('') + '\n');
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
