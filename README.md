# crypticker
Command line cryptocurrency price ticker.

![screenshot](https://github.com/sblaurock/crypticker/raw/master/screenshot.png "Example screenshot of ticker.")

### Installation
Installation can be done via `npm` as a global package
```bash
npm i -g crypticker
```

### Usage
Once installed globally, `crypticker` can be run as a binary
```bash
crypticker
```
    

### Options
Markets and application preferences can be managed within `options.json`. If the package was installed globally, the options file may be found with `which crypticker`.

| Parameter | Type | Description | Example |
| --- | --- | --- | --- |
| pollInterval | Integer | Interval at which to poll API (in milliseconds) | `30000` |
| padding | Integer | Number of spaces to use between display sections | `8` |
| history | Object | Parameters around ticker history display | |
| \|-enabled | Boolean | Toggles history display on and off | `true` |
| \|-length | Integer | Number of ticks to display within readout | `16` |
| \|-neutralSymbol | String | Symbol to use for no trend | `⋅` |
| \|-positiveSymbol | String | Symbol to use for positive trend | `➚` |
| \|-negativeSymbol | String | Symbol to use for negative trend | `➘` |
| markets | Array | List of markets to monitor | `['kraken:ethusd']` |

Powered by the [Cryptowatch](https://cryptowat.ch/docs/api) public API. A listing of supported markets can be found [here](https://api.cryptowat.ch/markets).
