# Splunk HTTP Event Collector Stream for Bunyan

#### Version 0.9.0

This project provides a stream for Splunk's HTTP Event Collector to be used with [Bunyan](https://www.npmjs.com/package/bunyan).

## Requirements

* Splunk 6.3+.
* An HTTP Event Collector token from your Splunk server.
* Node.js v0.10+.
* [Bunyan](https://www.npmjs.com/package/bunyan) (`npm install --save bunyan`).

## Installation

If you already have Node.js and npm installed, simply run: `npm install --save splunk-bunyan-logger`.

## Usage

See the `examples` folder for more examples:

* `all_batching.js`: shows how to configure a Bunyan Stream with the 3 batching settings: `batchInterval`, `maxBatchCount`, & `maxBatchSize`.
* `basic.js`: shows how to configure a Bunyan stream and send a log message to Splunk.
* `custom_format.js`: shows how to configure a Bunyan Stream to log messages to Splunk using a custom format.
* `manual_batching.js`: shows how to queue log messages, and send them in batches by manually calling `flush()`.
* `retry.js`: shows how to configure retries on errors.

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
    // Message can be anything, doesn't have to be an object
    message: {
        temperature: "70F",
        chickenCount: 500
    }
};

console.log("Sending payload", payload);
Logger.info(payload, "Chicken coup looks stable.");
```

## Community

Stay connected with other developers building on Splunk.

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

You can reach the Developer Platform team at _devinfo@splunk.com_.

## License

The Splunk HTTP Event Collector Stream for Bunyan is licensed under the Apache
License 2.0. Details can be found in the LICENSE file.
