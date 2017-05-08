# crypticker
Command line cryptocurrency price ticker.

![screenshot](https://github.com/sblaurock/crypticker/raw/master/screenshot.png "Example screenshot of ticker.")

### Setup
    npm install

### Usage
    npm start

### Options
Markets and application preferences can be managed within `options.json`.

| Parameter | Type | Description | Example |
| --- | --- | --- | --- |
| pollInterval | Integer | Interval at which to poll API (in milliseconds) | `30000` |
| padding | Integer | Number of spaces to use between display sections | `8` |
| history | Object | Parameters around ticker history display | |
| - enabled | Boolean | Toggles history display on and off | `true` |
| - length | Integer | Number of ticks to display within readout | `16` |
| - neutralSymbol | String | Symbol to use for no trend | `⋅` |
| - positiveSymbol | String | Symbol to use for positive trend | `➚` |
| - negativeSymbol | String | Symbol to use for negative trend | `➘` |
| markets | Array | Listing of markets to monitor | `['kraken:ethusd']` |

Powered by the [Cryptowatch](https://cryptowat.ch/docs/api) public API. A listing of supported markets can be found [here](https://api.cryptowat.ch/markets).
