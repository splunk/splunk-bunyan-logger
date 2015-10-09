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
 * This example shows how to use middleware with the Splunk
 * Bunyan logger.
 */

// Change to require("splunk-bunyan-logger");
var splunkBunyan = require("../index");
var bunyan = require("bunyan");

/**
 * Only the token property is required.
 * Defaults are listed explicitly.
 *
 * Alternatively, specify config.url like so:
 *
 * "https://localhost:8088/services/collector/event/1.0"
 */
var config = {
    token: "your-token-here",
    host: "localhost",
    path: "/services/collector/event/1.0",
    protocol: "https",
    port: 8088,
    level: "info",
    autoFlush: true,
    maxRetries: 0
};
var splunkStream = splunkBunyan.createStream(config);

splunkStream.on("error", function(err, context) {
    // Handle errors here
    console.log("Error", err, "Context", context);
});

// Add a middleware function
splunkStream.use(function(context, next) {
    console.log("Message before middleware", context.message);

    // Add a property to the message if it's an object
    if (typeof context.message === "object") {
        context.message.nestedValue = {
            b00l: true,
            another: "string"
        };
    }

    console.log("Message after middleware", context.message);
    next(null, context);
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
console.log("Sending payload", payload);
Logger.info(payload, "description of payload");