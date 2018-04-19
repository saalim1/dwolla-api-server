# DwollaV2 Node

![Build Status](https://travis-ci.org/Dwolla/dwolla-v2-node.svg)

Dwolla V2 Node client.

[API Documentation](https://docsv2.dwolla.com)


## `dwolla.Client`

### Basic usage

```javascript
var dwolla = require('dwolla-v2');

var client = new dwolla.Client({
  key: process.env.DWOLLA_APP_KEY,
  secret: process.env.DWOLLA_APP_SECRET,
});
```

### Using the sandbox environment (optional)

```javascript
var dwolla = require('dwolla-v2');

var client = new dwolla.Client({
  key: process.env.DWOLLA_APP_KEY,
  secret: process.env.DWOLLA_APP_SECRET,
  environment: 'sandbox',
});
```

*Note: `environment` defaults to `production`
