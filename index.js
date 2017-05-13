const colors = require('colors');
const leftPad = require('left-pad');
const rightPad = require('right-pad');
const needle = require('needle');
const _ = require('lodash');
const options = require('./options.json');

// Utility functions
const utility = {
  // Convert string to title case
  toTitleCase: string => string.replace(/\w\S*/g, text => text.charAt(0).toUpperCase() + text.substr(1).toLowerCase()),

  // Add commas to number
  addCommas: string => string.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,')
};

// Write display to STDOUT
let previousPriceData = {};
const priceDataHistory = {};
let previousExchange = null;
let previousCurrency = null;
let statusOutput = '';
let apiFailure = false;
const writeToStdout = (priceData, allowance) => {
  let outputData = priceData;

  // Clear screen
  process.stdout.write('\x1Bc');
  process.stdout.write('\n');

  // Ensure we've not exhausted API limits
  if (!priceData && _.keys(previousPriceData).length()) {
    outputData = previousPriceData;
    apiFailure = true;
  } else if (!priceData) {
    return process.stdout.write(`${colors.red(' ⚠ API limit has been reached')}\n\n`);
  }

  const sortedExchanges = _.keys(outputData).sort();
  const longestExchangeLength = sortedExchanges.sort((a, b) => b.length - a.length)[0].length;

  _.forEach(sortedExchanges, (exchange) => {
    const sortedMarkets = _.keys(outputData[exchange]).sort();

    _.forEach(sortedMarkets, (market) => {
      const currencyA = market.substr(0, 3);
      const currencyB = market.substr(3, 3);
      const changePercentage = outputData[exchange][market].price.change.percentage * 100;
      const changePercentageFixed = (changePercentage).toFixed(2);
      let exchangeOutput = '';
      let currencyOutput = '';
      let changeOutput = '';
      let historyChangeOutput = '';

      // Show exchange name
      if (previousExchange !== exchange) {
        exchangeOutput = colors.bold.white(` › ${rightPad(utility.toTitleCase(exchange), longestExchangeLength)}`) + leftPad('', options.app.padding);
        previousExchange = exchange;
      } else {
        exchangeOutput = colors.bold(leftPad('', longestExchangeLength + 3)) + leftPad('', options.app.padding);
      }

      // Show currency name
      if (previousCurrency !== currencyA) {
        currencyOutput = `${currencyA.toUpperCase()}`;
        previousCurrency = currencyA;
      } else {
        currencyOutput = leftPad('', 3);
      }

      // Show percent change in last 24 hours
      if ((outputData[exchange][market].price.change.percentage * 100).toFixed(2) > 0) {
        changeOutput = rightPad(colors.green(`▲ ${changePercentageFixed.toString()}%`), 8);
      } else if ((outputData[exchange][market].price.change.percentage * 100).toFixed(2) < 0) {
        changeOutput = rightPad(colors.red(`▼ ${(changePercentageFixed * -1).toString()}%`), 8);
      } else {
        changeOutput = rightPad(`- ${changePercentageFixed.toString()}%`, 8);
      }

      // Show history of price updates
      if (
        options.app.history.enabled &&
        previousPriceData[exchange] &&
        previousPriceData[exchange][market] &&
        +(previousPriceData[exchange][market].price.last)
      ) {
        const currentLastPrice = outputData[exchange][market].price.last.toFixed(2);
        const previousLastPrice = previousPriceData[exchange][market].price.last.toFixed(2);
        const majorThreshold = options.app.history.majorThreshold;
        let symbol;

        // Determine history symbol
        if (Math.abs(currentLastPrice - previousLastPrice).toFixed(2) > majorThreshold) {
          symbol = currentLastPrice > previousLastPrice ?
            options.app.history.positiveMajorSymbol :
            options.app.history.negativeMajorSymbol;
        } else {
          symbol = currentLastPrice > previousLastPrice ?
            options.app.history.positiveMinorSymbol :
            options.app.history.negativeMinorSymbol;
        }

        priceDataHistory[exchange + market] = priceDataHistory[exchange + market] || new Array(options.app.history.length).fill(' ');

        if (
          currentLastPrice > previousLastPrice &&
          currentLastPrice - previousLastPrice > options.app.history.minorThreshold
        ) {
          // Price has increased since last update and was greater than threshold
          priceDataHistory[exchange + market].push(colors.green.bold(symbol));
        } else if (
          currentLastPrice < previousLastPrice &&
          previousLastPrice - currentLastPrice > options.app.history.minorThreshold
        ) {
          // Price has decreased since last update and was greater than threshold
          priceDataHistory[exchange + market].push(colors.red.bold(symbol));
        } else {
          priceDataHistory[exchange + market].push(colors.grey(options.app.history.neutralSymbol));
        }

        historyChangeOutput = (currentLastPrice - previousLastPrice).toFixed(2);

        if (historyChangeOutput >= 0) {
          historyChangeOutput = `+${Math.abs(historyChangeOutput)}`;
        }
      }

      // Show request status
      if (
        allowance.remaining < 100000000
      ) {
        if (!apiFailure) {
          statusOutput = `${colors.yellow(' ⚠ API limit is close to being reached')}\n`;
        } else {
          statusOutput = `${colors.red(' ⚠ API limit has been reached')}\n`;
        }
      } else {
        apiFailure = false;
        statusOutput = '';
      }

      // eslint-disable-next-line prefer-template, no-useless-concat
      process.stdout.write(exchangeOutput + currencyOutput + leftPad('', options.app.padding) + `${leftPad(utility.addCommas(outputData[exchange][market].price.last.toFixed(2)), 10)} ${currencyB.toUpperCase()} ` + changeOutput + ` ${(priceDataHistory[exchange + market] || '') && priceDataHistory[exchange + market].slice(-1 * options.app.history.length).join('')}` + ` ${colors.grey(historyChangeOutput)}` + '\n');
    });

    process.stdout.write('\n');
  });

  process.stdout.write(`${statusOutput}`);

  previousExchange = null;
  previousPriceData = priceData;

  return true;
};

// Retrieve pricing information from endpoint
const retrieveMarketData = () => {
  const priceData = {};

  needle.get('https://api.cryptowat.ch/markets/summaries', (error, response) => {
    if (!error && response && response.body && response.statusCode === 200) {
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
    } else if (response && response.statuscode === 429) {
      writeToStdout(null);
    }
  });
};

// Kick out the jams
setInterval(() => {
  retrieveMarketData();
}, options.app.pollInterval);
retrieveMarketData();
