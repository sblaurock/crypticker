const colors = require('colors');
const leftPad = require('left-pad');
const rightPad = require('right-pad');
const needle = require('needle');
const _ = require('lodash');
const options = require('./options.json');

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
let previousCurrency = null;
let statusOutput = '';
let apiFailure = false;
const writeToStdout = (priceData, allowance) => {
  process.stdout.write('\033c');
  process.stdout.write('\n');

  // Ensure we've not exhausted API limits
  if (!priceData && _.keys(previousPriceData).length()) {
    priceData = previousPriceData;
    apiFailure = true;
  } else if (!priceData) {
    return process.stdout.write(`${colors.red(' ⚠ API limit has been reached')}\n\n`);
  }

  const sortedExchanges = _.keys(priceData).sort();
  const longestExchangeLength = sortedExchanges.sort((a, b) => { return b.length - a.length; })[0].length;

  _.forEach(sortedExchanges, (exchange) => {
    const sortedMarkets = _.keys(priceData[exchange]).sort();

    _.forEach(sortedMarkets, (market) => {
      const currencyA = market.substr(0, 3);
      const currencyB = market.substr(3, 3);
      let exchangeOutput = '';
      let currencyOutput = '';
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

      // Show currency name
      if (previousCurrency !== currencyA) {
        currencyOutput = `${currencyA.toUpperCase()}`;
        previousCurrency = currencyA;
      } else {
        currencyOutput = leftPad('', 3);
      }

      // Show percent change in last 24 hours
      if (priceData[exchange][market].price.change.percentage > 0) {
        changeOutput = colors.green(`▲ ${rightPad((priceData[exchange][market].price.change.percentage * 100).toFixed(2).toString() + '%', 6)}`);
      } else if (priceData[exchange][market].price.change.percentage < 0) {
        changeOutput = colors.red(`▼ ${rightPad(((priceData[exchange][market].price.change.percentage * 100).toFixed(2) * -1).toString() + '%', 6)}`);
      } else {
        changeOutput = `- ${rightPad((priceData[exchange][market].price.change.percentage * 100).toFixed(2).toString() + '%', 6)}`;
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
          priceDataHistory[exchange + market].push(colors.grey(options.app.history.neutralSymbol));
        }

        historyChangeOutput = (priceData[exchange][market].price.last - previousPriceData[exchange][market].price.last).toFixed(2);

        if (historyChangeOutput >= 0) {
          historyChangeOutput = `+${Math.abs(historyChangeOutput).toFixed(2)}`;
        }
      }

      // Show request status
      if (
        options.app.status.enabled &&
        allowance.remaining < 100000000
      ) {
        if (!apiFailure) {
          statusOutput = `${colors.yellow(' ⚠ API limit is close to being reached')}\n`;
        } else {
          statuOutput = `${colors.red(' ⚠ API limit has been reached')}\n`;
        }
      } else {
        apiFailure = false;
        statusOutput = '';
      }

      process.stdout.write(exchangeOutput + currencyOutput + leftPad('', options.app.padding) + `${leftPad(addCommas(priceData[exchange][market].price.last.toFixed(2)), 10)} ${currencyB.toUpperCase()} ` + `${changeOutput}` + ` ${(priceDataHistory[exchange + market] || '') && priceDataHistory[exchange + market].slice(-1 * options.app.history.length).join('')}` + ` ${colors.grey(historyChangeOutput)}` + `\n`);
    });

    process.stdout.write('\n');
  });

  process.stdout.write(`${statusOutput}`);

  previousExchange = null;
  previousPriceData = priceData;
};

// Retrieve pricing information from endpoint
const retrieveMarketData = () => {
  let priceData = {};

  needle.get('https://api.cryptowat.ch/markets/summaries', (error, response) => {
    if (!error && response.statusCode === 200) {
      _.forEach(response.body.result, (data, market) => {
        if (options.markets.indexOf(market) === -1) {
          return;
        }

        const [exchange, marketName] = market.split(':');

        priceData[exchange] = priceData[exchange] || {};
        priceData[exchange][marketName] = response.body && response.body.result[market];
      });

      if (priceData) {
        writeToStdout(priceData, response.body.allowance);
      }
    } else if (response.statuscode === 429) {
      writeToStdout(null);
    }
  });
};

// Kick out the jams
setInterval(() => {
  retrieveMarketData();
}, options.app.pollInterval);
retrieveMarketData();
