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

var Stream = require("stream").Writable;
var util = require("util");

var SplunkLogging = require("splunk-logging");
var SplunkLogger = SplunkLogging.Logger;

/**
 * A class that implements a raw writable stream.
 *
 * @property {object} config - Configuration settings for this <code>SplunkStream</code> instance.
 * @property {object[]} contextQueue - Queue of <code>context</code> objects to be sent to Splunk.
 * @property {function} error - A callback function for errors: <code>function(err, context)</code>.
 * Defaults to <code>console.log</code> both values;
 *
 * @param {object} config - Configuration settings for a new [SplunkLogger]{@link SplunkLogger}.
 * @param {string} config.token - HTTP Event Collector token, required.
 * @param {string} [config.name=splunk-javascript-logging/0.9.3] - Name for this logger.
 * @param {string} [config.host=localhost] - Hostname or IP address of Splunk server.
 * @param {string} [config.maxRetries=0] - How many times to retry when HTTP POST to Splunk fails.
 * @param {string} [config.path=/services/collector/event/1.0] - URL path to send data to on the Splunk server.
 * @param {string} [config.protocol=https] - Protocol used to communicate with the Splunk server, <code>http</code> or <code>https</code>.
 * @param {number} [config.port=8088] - HTTP Event Collector port on the Splunk server.
 * @param {string} [config.url] - URL string to pass to {@link https://nodejs.org/api/url.html#url_url_parsing|url.parse}. This will try to set
 * <code>host</code>, <code>path</code>, <code>protocol</code>, <code>port</code>, <code>url</code>. Any of these values will be overwritten if 
 * the corresponding property is set on <code>config</code>.
 * @param {string} [config.level=info] - Logging level to use, will show up as the <code>severity</code> field of an event, see
 *  [SplunkLogger.levels]{@link SplunkLogger#levels} for common levels.
 * @param {number} [config.batchInterval=0] - Automatically flush events after this many milliseconds.
 * When set to a non-positive value, events will be sent one by one. This setting is ignored when non-positive.
 * @param {number} [config.maxBatchSize=0] - Automatically flush events after the size of queued
 * events exceeds this many bytes. This setting is ignored when non-positive.
 * @param {number} [config.maxBatchCount=1] - Automatically flush events after this many
 * events have been queued. Defaults to flush immediately on sending an event. This setting is ignored when non-positive.
 * @constructor
 * @implements {@link https://nodejs.org/api/stream.html#stream_class_stream_writable|Stream.Writable}
 */
var SplunkStream = function (config) {
    /** @type {SplunkLogger} */
    this.logger = new SplunkLogger(config);

    // If using the common logger's default name, change it
    if (this.logger.config.name.match("splunk-javascript-logging/\\d\\.\\d\\.\\d")) {
        this.logger.config.name = "splunk-bunyan-logger/0.9.3";
    }

    // Overwrite the common library's error callback
    var that = this;
    this.logger.error = function(err, context) {
        that.emit("error", err, context);
    };

    /* jshint unused:false */
    /**
     * A callback function called after sending a request to Splunk:
     *  <code>function(err, response, body)</code>. Defaults
     * to an empty function.
     *
     * @type {function}
     */
    this.send = function(err, resp, body) {};
};
util.inherits(SplunkStream, Stream);

/**
 * Returns the configuration for this logger.
 * See {@link SplunkStream}.
 *
 * @returns {Object} Configuration for this logger.
 * @public
 */
SplunkStream.prototype.config = function() {
    return this.logger.config;
};

/**
 * The <code>write()</code> function for <code>SplunkStream</code>.
 *
 * Bunyan will call this function when a user logs a message.
 * See [Bunyan raw streams]{@link https://github.com/trentm/node-bunyan#stream-type-raw}.
 *
 * @param {object} data - The data object is provided by Bunyan.
 * @public
 */
SplunkStream.prototype.write = function (data) {
    if (!data) {
        this.emit("error", new Error("Must pass a parameter to write."));
        return;
    }

    var context = {
        message: data,
        severity: module.exports.severityFromLevel(data.level),
        metadata: {
            time: data.time,
            host: data.hostname
        }
    };
    
    // Remove properties already added to the context
    delete context.message.level;
    delete context.message.time;
    delete context.message.hostname;

    // Clean up any existing metadata
    if (data.hasOwnProperty("host")) {
        context.metadata.host = data.host;
        delete data.host;
    }
    if (data.hasOwnProperty("source")) {
        context.metadata.source = data.source;
        delete data.source;
    }
    if (data.hasOwnProperty("sourcetype")) {
        context.metadata.sourcetype = data.sourcetype;
        delete data.sourcetype;
    }
    if (data.hasOwnProperty("index")) {
        context.metadata.index = data.index;
        delete data.index;
    }
    
    var that = this;
    this.logger.send(context, that.send);
};

/**
 * Splunk Bunyan Logger module, to be used with [Bunyan]{@link https://www.npmjs.com/package/bunyan}.
 *
 * See {@link https://github.com/splunk/splunk-bunyan-logger/tree/master/examples|examples} for usage.
 *
 * @module SplunkBunyanLogger
 * @namespace SplunkBunyanLogger
 */
module.exports =  {
    /**
     * Bunyan's logging levels.
     *
     * @default info
     * @readonly
     * @enum {string}
     * @memberof SplunkBunyanLogger
     */
    levels: {
        TRACE: "trace",
        DEBUG: "debug",
        INFO: "info",
        WARN: "warn",
        ERROR: "error",
        FATAL: "fatal"
    },
    /**
     * Translates a Bunyan logging level number to the name of the level.
     *
     * @param {number} level - A Bunyan logging level integer. See {@link SplunkBunyanLogger.levels}
     * @returns {string}
     * @memberof SplunkBunyanLogger
     */
    severityFromLevel: function (level) {
        switch(level) {
            case 10:
                return module.exports.levels.TRACE;
            case 20:
                return module.exports.levels.DEBUG;
            case 40:
                return module.exports.levels.WARN;
            case 50:
                return module.exports.levels.ERROR;
            case 60:
                return module.exports.levels.FATAL;
            default:
                return module.exports.levels.INFO;
        }
    },
    
    /**
     * Creates a Bunyan Stream object with the provided <code>config</code>.
     *
     * @param {object} config - See {@link SplunkStream}.
     * @returns {SplunkBunyanStream} A Bunyan Stream object.
     * @memberof SplunkBunyanLogger
     */
    createStream: function (config) {
        var stream =  new SplunkStream(config);
        /**
         * @typedef SplunkBunyanStream
         * @property {string} level The logging level for Bunyan.
         * @property {string} type Always <code>raw</code>.
         * @property {function} on Takes an <code>event</code> string, and a callback function.
         * The most useful event to listen for is <code>error</code>.
         * See {@link https://nodejs.org/api/events.html#events_emitter_on_event_listener|Node.js events} documentation.
         * @property {function} setEventFormatter Overrides the eventFormatter for the underlying SplunkLogger.
         * Takes a callback function parameter: <code>function(message, severity)</code>, where message
         * is an object, and severity is a string.
         * @property {function} on Adds a listener to to the SplunkStream object, typically used for the error event.
         * @property {function} flush Manually sends all queued events to Splunk in a single HTTP request.
         * Takes a callback function parameter: <code>function(err, response, body)</code>.
         * @property {SplunkStream} stream See {@link SplunkStream}
         */
        return {
            level: config.level || module.exports.levels.INFO,
            type: "raw",
            setEventFormatter: function(formatter) {
                this.stream.logger.eventFormatter = formatter;
            },
            on: function(event, callback) {
                this.stream.on(event, callback);
            },
            flush: function(callback) {
                // If flush is called with no param, use the send() callback
                callback = callback || this.stream.send;
                this.stream.logger.flush(callback);
            },
            stream: stream
        };
    }
};