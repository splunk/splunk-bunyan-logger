/*
 * Copyright 2015 Splunk, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"): you may
 * not use this file except in compliance with the License. You may obtain
 * a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */

/**
 * This example shows how to batch events with the
 * Splunk Bunyan logger with all available settings:
 * batchInterval, maxBatchCount, & maxBatchSize.
 */

// Change to require("splunk-bunyan-logger");
var splunkBunyan = require("../index");
var bunyan = require("bunyan");

/**
 * Only the token property is required.
 * 
 * Here, batchInterval is set to flush every 1 second, when
 * 10 events are queued, or when the size of queued events totals
 * more than 1kb.
 */
var config = {
    token: "your-token-here",
    url: "https://localhost:8088",
    batchInterval: 1000,
    maxBatchCount: 10,
    maxBatchSize: 1024 // 1kb
};
var splunkStream = splunkBunyan.createStream(config);

splunkStream.on("error", function(err, context) {
    // Handle errors here
    console.log("Error", err, "Context", context);
});

// Setup Bunyan, adding splunkStream to the array of streams
var Logger = bunyan.createLogger({
    name: "my logger",
    streams: [
        splunkStream
    ]
});

// Define the payload to send to Splunk's Event Collector
var payload = {
    // Our important fields
    temperature: "70F",
    chickenCount: 500,

    // Special keys to specify metadata for Splunk's Event Collector
    source: "chicken coop",
    sourcetype: "httpevent",
    index: "main",
    host: "farm.local"
};

// Send the payload
console.log("Queuing payload", payload);
Logger.info(payload, "Chicken coup looks stable.");

var payload2 = {
    // Our important fields
    temperature: "75F",
    chickenCount: 600,

    // Special keys to specify metadata for Splunk's Event Collector
    source: "chicken coop",
    sourcetype: "httpevent",
    index: "main",
    host: "farm.local"
};

// Send the payload
console.log("Queuing second payload", payload2);
Logger.info(payload2, "New chickens have arrived");

/**
 * Since we've configured batching, we don't need
 * to do anything at this point. Events will
 * will be sent to Splunk automatically based
 * on the batching settings above.
 */

// Kill the process
setTimeout(function() {
    console.log("Events should be in Splunk! Exiting...");
    process.exit();
}, 2000);