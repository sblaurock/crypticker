const colors = require('colors');
const leftPad = require('left-pad');
const rightPad = require('right-pad');
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

// Add commas to numeric string
const addCommas = (string) => {
  return string.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")
};

// Write display to STDOUT
let previousPriceData = {};
let priceDataHistory = {};
let previousExchange = null;
const writeToStdout = (priceData) => {
  const sortedExchanges = _.keys(priceData).sort();

  process.stdout.write('\033c');
  process.stdout.write('\n');

  const longestExchangeLength = sortedExchanges.sort((a, b) => { return b.length - a.length; })[0].length;

  _.forEach(sortedExchanges, (exchange) => {
    const sortedMarkets = _.keys(priceData[exchange]).sort();

    _.forEach(sortedMarkets, (market) => {
      const currencyA = market.substr(0, 3);
      const currencyB = market.substr(3, 3);
      let exchangeOutput = '';
      let changeOutput = '';
      let historyOutput = '';
      let historyChangeOutput = '';

      // Show exchange name
      if (previousExchange !== exchange) {
        exchangeOutput = colors.bold.white(` › ${rightPad(toTitleCase(exchange), longestExchangeLength)}`) + leftPad('', options.app.padding);
        previousExchange = exchange;
      } else {
        exchangeOutput = colors.bold.white(leftPad('', longestExchangeLength + 3)) + leftPad('', options.app.padding);
      }

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
        priceDataHistory[exchange + market] = priceDataHistory[exchange + market] || new Array(options.app.history.length).fill(' ');

        if (priceData[exchange][market].price.last > previousPriceData[exchange][market].price.last) {
          priceDataHistory[exchange + market].push(colors.green(options.app.history.positiveSymbol));
        } else if (priceData[exchange][market].price.last < previousPriceData[exchange][market].price.last) {
          priceDataHistory[exchange + market].push(colors.red(options.app.history.negativeSymbol));
        } else {
          priceDataHistory[exchange + market].push(options.app.history.neutralSymbol);
        }

        historyChangeOutput = (priceData[exchange][market].price.last - previousPriceData[exchange][market].price.last).toFixed(2);

        if (historyChangeOutput >= 0) {
          historyChangeOutput = `+${historyChangeOutput}`;
        }
      }

      process.stdout.write(exchangeOutput + `${currencyA.toUpperCase()}` + leftPad('', options.app.padding) + `${leftPad(addCommas(priceData[exchange][market].price.last.toFixed(2)), 8)} ${currencyB.toUpperCase()} ` + `${changeOutput}` + leftPad('', options.app.padding) + `${(priceDataHistory[exchange + market] || '') && priceDataHistory[exchange + market].slice(-1 * options.app.history.length).join('')}` + ` ${colors.grey(historyChangeOutput)}` + `\n`);
    });

    process.stdout.write('\n');
  });

  previousExchange = null;
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
