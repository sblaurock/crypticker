# crypticker
[![npm](https://img.shields.io/npm/v/crypticker.svg)](https://www.npmjs.com/package/crypticker)
[![npm](https://img.shields.io/npm/l/crypticker.svg)](https://www.npmjs.com/package/crypticker)
[![npm](https://img.shields.io/npm/dm/crypticker.svg)](https://www.npmjs.com/package/crypticker)
[![David](https://img.shields.io/david/sblaurock/crypticker.svg)](https://david-dm.org/sblaurock/crypticker)

Command line cryptocurrency price ticker for Bitcoin, Ethereum, Ripple, and more.

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

| Flag | Type | Description |
| --- | --- | --- |
| `--nohistory` | | Disable history display |
| `--interval` | Integer | Poll interval in milliseconds |
| `--markets` | String | Comma separated list of markets |

### Options
Markets and application preferences can be managed within `options.json`. If the package was installed globally, the installation directory (and corresponding `options.json`) file may be found with `npm ls crypticker`. Application will prefer an options file located at `~/.crypticker` if one exists - this can be used to preserve options between updates.

| Parameter | Type | Description | Example |
| --- | --- | --- | --- |
| pollInterval | Integer | Interval at which to poll API (in milliseconds) | `30000` |
| padding | Integer | Number of spaces to use between display sections | `8` |
| history | Object | Parameters around ticker history display | |
| history.enabled | Boolean | Toggles history display on and off | `true` |
| history.length | Integer | Number of ticks to display within readout | `16` |
| history.minorThreshold | Float | Change percentage that must be exceeded to display a minor symbol | `0.00` |
| history.majorThreshold | Float | Change percentage that must be exceeded to display a major symbol | `0.20` |
| history.positiveMajorSymbol | String | Symbol to use for positive major trend | `"∙"` |
| history.positiveMinorSymbol | String | Symbol to use for positive minor trend | `"⋅"` |
| history.neutralSymbol | String | Symbol to use for no trend | `"⋅"` |
| history.negativeMinorSymbol | String | Symbol to use for negative minor trend | `"⋅"` |
| history.negativeMajorSymbol | String | Symbol to use for negative major trend | `"∙"` |
| markets | Array | List of markets to monitor | `['kraken:ethusd']` |

Powered by the [Cryptowatch](https://cryptowat.ch/docs/api) public API. A listing of supported markets can be found [here](https://api.cryptowat.ch/markets).
