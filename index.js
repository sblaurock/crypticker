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
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(' › Poloniex'.bold.white + '\tETH'.white + colors.white(`\t${prices.poloniex.usd} USD\t${prices.poloniex.btc} BTC`));
};

connection.onopen = (session) => {
  const prices = {
    poloniex: {
      usd: '0.00',
      btc: '0.0000'
    }
  };

  session.subscribe('ticker', (data) => {
    if (data[0] === 'USDT_ETH') {
      prices.poloniex.usd = (+data[1]).toFixed(2);
    }

    if (data[0] === 'BTC_ETH') {
      prices.poloniex.btc = (+data[1]).toFixed(4);
    }

    writeToStdout(prices);
  });
}

connection.onclose = function () {
  console.log('Socket connection closed');
}

connection.open();
