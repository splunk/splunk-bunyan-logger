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
 * the Splunk Bunyan logger by manually calling flush.
 *
 * By default autoFlush is enabled, this means
 * an HTTP request is made for each log message.
 *
 * By disabling autoFlush, events will be queued
 * until flush() is called.
 */

// Change to require("splunk-bunyan-logger").Logger;
var splunkBunyan = require("../index");
var bunyan = require("bunyan");

/**
 * Only the token property is required.
 * 
 * Here, autoFlush is set to false
 */
var config = {
    token: "your-token-here",
    host: "localhost",
    path: "/services/collector/event/1.0",
    protocol: "https",
    port: 8088,
    level: "info",
    autoFlush: false
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
    host: "farm.local",
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
    host: "farm.local",
};

// Send the payload
console.log("Queuing second payload", payload2);
Logger.info(payload2, "New chickens have arrived");

/**
 * Since autoFlush is disabled, call flush manually.
 * This will send both payloads in a single
 * HTTP request.
 *
 * The callback for flush is optional.
 */
splunkStream.flush(function(err, resp, body) {
    // If successful, body will be { text: 'Success', code: 0 }
    console.log("Response from Splunk", body);
});
