# Splunk HTTP Event Collector Stream for Bunyan

#### Version 0.10.1

This project provides a [Bunyan](https://www.npmjs.com/package/bunyan) stream for HTTP Event Collector in Splunk Enterprise and Splunk Cloud.

## Requirements

* Node.js v4 or later.
* Splunk Enterprise 6.3.0 or later, or Splunk Cloud.
* An HTTP Event Collector token from your Splunk Enterprise or Splunk Cloud server.
* [Bunyan](https://www.npmjs.com/package/bunyan) (`npm install --save bunyan`).

## Installation

First, update npm to the latest version by running: `sudo npm install npm -g`.

Then run: `npm install --save splunk-bunyan-logger`.

## Usage

See the `examples` folder for usage examples:

* `all_batching.js`: Shows how to configure a Bunyan Stream with the 3 batching settings: `batchInterval`, `maxBatchCount`, & `maxBatchSize`.
* `basic.js`: Shows how to configure a Bunyan stream and send a log message to Splunk.
* `custom_format.js`: Shows how to configure a Bunyan Stream to log messages to Splunk using a custom format.
* `manual_batching.js`: Shows how to queue log messages, and send them in batches by manually calling `flush()`.
* `retry.js`: Shows how to configure retries on errors.

### SSL

Note: SSL certificate validation is diabled by default.
To enable it, set `logger.requestOptions.strictSSL = true` on your `SplunkStream` instance:

```javascript
var bunyan = require("bunyan");
var splunkBunyan = require("splunk-bunyan-logger");

var config = {
    token: "your-token-here",
    url: "https://splunk.local:8088"
};

var splunkStream = splunkBunyan.createStream(config);
// Enable SSL certificate validation
stream.logger.requestOptions.strictSSL = true;

// Note: splunkStream must be set to an element in the streams array
var Logger = bunyan.createLogger({
    name: "my logger",
    streams: [
        splunkStream
    ]
});
```

### Basic example

```javascript
var bunyan = require("bunyan");
var splunkBunyan = require("splunk-bunyan-logger");

var config = {
    token: "your-token-here",
    url: "https://splunk.local:8088"
};

var splunkStream = splunkBunyan.createStream(config);

// Note: splunkStream must be set to an element in the streams array
var Logger = bunyan.createLogger({
    name: "my logger",
    streams: [
        splunkStream
    ]
});

var payload = {
    // Message can be anything; doesn't have to be an object
    message: {
        temperature: "70F",
        chickenCount: 500
    }
};

console.log("Sending payload", payload);
Logger.info(payload, "Chicken coup looks stable.");
```

## Community

Stay connected with other developers building on Splunk software.

<table>

<tr>
<td><b>Email</b></td>
<td>devinfo@splunk.com</td>
</tr>

<tr>
<td><b>Issues</b>
<td><span>https://github.com/splunk/splunk-bunyan-logger/issues/</span></td>
</tr>

<tr>
<td><b>Answers</b>
<td><span>http://answers.splunk.com/</span></td>
</tr>

<tr>
<td><b>Blog</b>
<td><span>http://blogs.splunk.com/dev/</span></td>
</tr>

<tr>
<td><b>Twitter</b>
<td>@splunkdev</td>
</tr>

</table>

### Contact us

You can reach the developer platform team at _devinfo@splunk.com_.

## License

The Splunk HTTP Event Collector Stream for Bunyan is licensed under the Apache
License 2.0. Details can be found in the LICENSE file.
