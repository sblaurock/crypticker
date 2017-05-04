const autobahn = require('autobahn');
const colors = require('colors');

const options = {
  url: 'wss://api.poloniex.com'
};

const connection = new autobahn.Connection({
  url: options.url,
  realm: 'realm1'
});

connection.onopen = (session) => {
  session.subscribe('ticker', (data) => {
    if (data[0] === 'USDT_ETH') {
      const price = (+ data[1]).toFixed(2);

      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(' › Poloniex'.white + '\tETH'.white + colors.white(`\t${price} USD`));
    }
  });
}

connection.onclose = function () {
  console.log('Socket connection closed');
}

connection.open();
