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
 * This example shows how to use a custom event format
 * for the Splunk Bunyan logger.
 */

// Change to require("splunk-bunyan-logger");
var splunkBunyan = require("../index");
var bunyan = require("bunyan");

/**
 * Only the token property is required.
 */
var config = {
    token: "your-token-here",
    url: "https://localhost:8088"
};
var splunkStream = splunkBunyan.createStream(config);

splunkStream.on("error", function(err, context) {
    // Handle errors here
    console.log("Error", err, "Context", context);
});

/**
 * Override the default eventFormatter() function,
 * which takes a message and severity, returning
 * any type - string or object are recommended.
 *
 * The message parameter can be any type. It will
 * be whatever was passed to Logger.send().
 * Severity will always be a string.
 *
 * In this example, we're building up a string
 * of key=value pairs if message is an object,
 * otherwise the message value is as value for
 * the message key.
 * This string is prefixed with the event
 * severity in square brackets.
 */
splunkStream.setEventFormatter(function(message, severity) {
    var event = "[" + severity + "]";

    if (typeof message === "object") {
        for (var key in message) {
            event += key + "=" + message[key] + " ";
        }
    }
    else {
        event += "message=" + message;
    }
    
    return event;
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

/**
 * Since maxBatchCount is set to 1 by default,
 * calling send will immediately send the payload.
 * 
 * The underlying HTTP POST request is made to
 *
 *     https://localhost:8088/services/collector/event/1.0
 *
 * with the following body (the pid will be different)
 *
 *     {
 *         "source": "chicken coop",
 *         "sourcetype": "httpevent",
 *         "index": "main",
 *         "host": "farm.local",
 *         "event": "[info]name=my logger pid=35265 temperature=70F chickenCount=500 msg=Chicken coup looks stable. v=0"
 *     }
 *
 */
console.log("Sending payload", payload);
Logger.info(payload, "Chicken coup looks stable.");