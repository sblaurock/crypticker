const colors = require('colors');
const leftPad = require('left-pad');
const needle = require('needle');
const _ = require('lodash');
const options = require('./options.json');

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

// Convert string to titlecase
const toTitleCase = (string) => {
  return string.replace(/\w\S*/g, (text) => {
    return text.charAt(0).toUpperCase() + text.substr(1).toLowerCase();
  });
};

// Write display to STDOUT
let previousPriceData = {};
let priceDataHistory = {};
const writeToStdout = (priceData) => {
  const sortedExchanges = _.keys(priceData).sort();

  process.stdout.moveCursor(0, -4);
  process.stdout.cursorTo(0);
  process.stdout.clearScreenDown();
  process.stdout.write('\n');

  _.forEach(sortedExchanges, (exchange) => {
    const sortedMarkets = _.keys(priceData[exchange]).sort();

    _.forEach(sortedMarkets, (market) => {
      const currencyA = market.substr(0, 3);
      const currencyB = market.substr(3, 3);
      let changeOutput = '';
      let historyOutput = '';

      // Show percent change in last 24 hours
      if (priceData[exchange][market].price.change.percentage > 0) {
        changeOutput = colors.green(`▲ ${(priceData[exchange][market].price.change.percentage * 100).toFixed(2)}%`);
      } else if (priceData[exchange][market].price.change.percentage < 0) {
        changeOutput = colors.red(`▼ ${Math.abs((priceData[exchange][market].price.change.percentage * 100).toFixed(2))}%`);
      } else {
        changeOutput = `- ${(priceData[exchange][market].price.change.percentage * 100).toFixed(2)}%`;
      }

      // Show history of price updates
      if (
        options.app.history.enabled &&
        previousPriceData[exchange] &&
        previousPriceData[exchange][market] &&
        +(previousPriceData[exchange][market].price.last)
      ) {
        priceDataHistory[exchange + market] = priceDataHistory[exchange + market] || [];

        if (priceData[exchange][market].price.last > previousPriceData[exchange][market].price.last) {
          priceDataHistory[exchange + market].push(colors.green(options.app.history.positiveSymbol));
        } else if (priceData[exchange][market].price.last < previousPriceData[exchange][market].price.last) {
          priceDataHistory[exchange + market].push(colors.red(options.app.history.negativeSymbol));
        } else {
          priceDataHistory[exchange + market].push(options.app.history.neutralSymbol);
        }
      }

      process.stdout.write(colors.bold.white(` › ${toTitleCase(exchange)}`) + `\t${currencyA.toUpperCase()}` + `\t${leftPad(priceData[exchange][market].price.last, 8)} ${currencyB.toUpperCase()} ` + `${changeOutput}` + `\t${(priceDataHistory[exchange + market] || '') && priceDataHistory[exchange + market].slice(-1 * options.app.history.length).join('')}` + `\n`);
    });
  });

  previousPriceData = priceData;
};

// Retrieve pricing information from endpoint
const retrieveMarketData = () => {
  let leftToResolve = options.markets.length;
  let priceData = {};

  options.markets.forEach((market) => {
    needle.get(`https://api.cryptowat.ch/markets/${market}/summary`, (error, response) => {
      if (!error && response.statusCode == 200) {
        const [exchange, marketName] = market.split('/');

        priceData[exchange] = priceData[exchange] || {};
        priceData[exchange][marketName] = response.body && response.body.result;
      }

      leftToResolve--;

      if (!leftToResolve) {
        writeToStdout(priceData);
      }
    });
  });
};

// Kick out the jams
setInterval(() => {
  retrieveMarketData();
}, options.app.pollInterval);
retrieveMarketData();

//const prices = {
  //poloniex: {
    //eth: {
      //current: {
        //usd: '00.00',
        //btc: '0.0000'
      //},
      //change: {
        //usd: '0.00',
        //btc: '0.00'
      //}
    //},
    //btc: {
      //current: {
        //usd: '0000.00'
      //},
      //change: {
        //usd: '0.00'
      //}
    //}
  //}
//};

//session.subscribe('ticker', (data) => {
  //if (data[0] === 'USDT_ETH') {
    //prices.poloniex.eth.current.usd = (+data[1]).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
    //prices.poloniex.eth.change.usd = (+data[4] * 100).toFixed(2);
  //}

  //if (data[0] === 'BTC_ETH') {
    //prices.poloniex.eth.current.btc = (+data[1]).toFixed(4).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
    //prices.poloniex.eth.change.btc = (+data[4] * 100).toFixed(2);
  //}

  //if (data[0] === 'USDT_BTC') {
    //prices.poloniex.btc.current.usd = (+data[1]).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
    //prices.poloniex.btc.change.usd = (+data[4] * 100).toFixed(2);
  //}

  //writeToStdout(prices);
//});
