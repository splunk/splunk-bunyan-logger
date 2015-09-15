var Stream = require("stream").Writable;
var util = require("util");

var SplunkLogger = require("splunk-logging").Logger;

/**
 * A class that implements a raw writable stream.
 *
 * @property {object} config - Configuration settings for this <code>SplunkStream</code> instance.
 * @property {function[]} middlewares - Middleware functions to run before sending data to Splunk. See {@link SplunkLogger#use}
 * @property {object[]} contextQueue - Queue of <code>context</code> objects to be sent to Splunk.
 * @property {function} error - A callback function for errors: <code>function(err, context)</code>.
 * Defaults to <code>console.log</code> both values;
 *
 * @param {object} config - Configuration settings for a new [SplunkLogger]{@link SplunkLogger}.
 * @param {string} config.token - Splunk HTTP Event Collector token, required.
 * @param {string} [config.name=splunk-javascript-logging/0.8.0] - Name for this logger.
 * @param {string} [config.host=localhost] - Hostname or IP address of Splunk server.
 * @param {string} [config.path=/services/collector/event/1.0] - URL path to send data to on the Splunk server.
 * @param {string} [config.protocol=https] - Protocol used to communicate with the Splunk server, <code>http</code> or <code>https</code>.
 * @param {number} [config.port=8088] - HTTP Event Collector port on the Splunk server.
 * @param {string} [config.url] - URL string to pass to {@link https://nodejs.org/api/url.html#url_url_parsing|url.parse}. This will try to set
 * <code>host</code>, <code>path</code>, <code>protocol</code>, <code>port</code>, <code>url</code>. Any of these values will be overwritten if 
 * the corresponding property is set on <code>config</code>.
 * @param {string} [config.level=info] - Logging level to use, will show up as the <code>severity</code> field of an event, see
 *  [SplunkLogger.levels]{@link SplunkLogger#levels} for common levels.
 * @param {bool} [config.autoFlush=true] - Send events immediately or not.
 * @constructor
 * @implements {@link https://nodejs.org/api/stream.html#stream_class_stream_writable|Stream.Writable}
 */
var SplunkStream = function (config) {
    /** @type {SplunkLogger} */
    this.logger = new SplunkLogger(config);

    // If using the common logger's default name, change it
    if (this.logger.config.name.match("splunk-javascript-logging/\\d\\.\\d\\.\\d")) {
        this.logger.config.name = "splunk-bunyan-logger/0.8.0";
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
 * @example <caption>With event auto flush (default), each log will make an HTTP request.</caption>
 * var bunyan = require("bunyan");
 * var SplunkBunyanLogger = require("splunk-bunyan-logger");
 *
 * var config = {
 *     token: "your-token-here",
 *     level: "info",
 *     autoFlush: false
 * };
 * var splunkStream = SplunkBunyanLogger.createStream(config);
 *
 * // Custom error handling by listening for the <code>error</code> event
 * splunkStream.on("error", function(err) {
 *     // Do something with the error.
 * });
 *
 * // Optional: add any custom express-like middleware function(s) to the chain
 * splunkStream.use(function(context, next) {
 *     context.data.extraProperty = "added in middleware";      
 *
 *     var error = null;
 *     next(error, context);
 * });
 *
 * // Setup Bunyan with the splunkStream we just configured
 * var Logger = bunyan.createLogger({
 *     name: "my logger",
 *     streams: [
 *         splunkStream
 *     ]
 * });
 * 
 * // Payload to send to Event Collector
 * var payload = {
 *     temperature: "70F",
 *     chickenCount: 500,
 *     source: "chicken coop",
 *     sourcetype: "httpevent",
 *     index: "main",
 *     host: "farm.local",
 *     severity: "info"
 * };
 * 
 * // Send the event to Splunk!
 * Logger.info(payload, "description of payload");
 *
 *
 * @example <caption>Without event auto flush, you must manually call <code>flush()</code> to send events.</caption>
 * var bunyan = require("bunyan");
 * var SplunkBunyanLogger = require("splunk-bunyan-logger");
 *
 * var config = {
 *     token: "your-token-here",
 *     level: "info",
 *     autoFlush: true
 * };
 * var splunkStream = SplunkBunyanLogger.createStream(config);
 *
 * // Custom error handling by listening for the <code>error</code> event
 * splunkStream.on("error", function(err) {
 *     // Do something with the error.
 * });
 *
 * // Optional: add any custom express-like middleware function(s) to the chain
 * splunkStream.use(function(context, next) {
 *     context.data.extraProperty = "added in middleware";      
 *
 *     var error = null;
 *     next(error, context);
 * });
 *
 * // Setup Bunyan with the splunkStream we just configured
 * var Logger = bunyan.createLogger({
 *     name: "my logger",
 *     streams: [
 *         splunkStream
 *     ]
 * });
 * 
 * // Payload to send to Event Collector
 * var payload = {
 *     temperature: "70F",
 *     chickenCount: 500,
 *     source: "chicken coop",
 *     sourcetype: "httpevent",
 *     index: "main",
 *     host: "farm.local",
 *     severity: "info"
 * };
 * 
 * // Queue some events
 * Logger.info(payload, "description of payload");
 * Logger.info(payload, "description of payload");
 * Logger.info(payload, "description of payload");
 * Logger.info(payload, "description of payload");
 * 
 * // Manually flush, sends all events to Splunk in a single HTTP request
 * splunkBunyanStream.flush(function(err, resp, body) {
 *     if (!err) {
 *         console.log("Success!");
 *     }
 * });
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
         * @property {string} type Always <code>raw</code>
         * @property {function} use Takes a middleware function parameter: <code>function(context, next)</code>,
         * this function must call <code>next(error, context)</code>.
         * Adds an express-like middleware function to run before sending the
         * data to Splunk. Multiple middleware functions can be used, they will be executed
         * in the order they are added.
         * @property {function} on Takes an <code>event</code> string, and a callback function.
         * The most useful event to listen for is <code>error</code>.
         * See {@link https://nodejs.org/api/events.html#events_emitter_on_event_listener|Node.js events} documentation.
         * @property {function} flush When <code>config.autoFlush = false</code>, manually sends events to Splunk
         * all queued events to Splunk in a single HTTP request. Takes a callback
         * function parameter: <code>function(err, response, body)</code>.
         * @property {SplunkStream} stream See {@link SplunkStream}
         */
        return {
            level: config.level || module.exports.levels.INFO,
            type: "raw",
            use: function(middleware) {
                this.stream.logger.use(middleware);
            },
            on: function(event, callback) {
                this.stream.on(event, callback);
            },
            flush: function(callback) {
                this.stream.logger.flush(callback);
            },
            stream: stream
        };
    }
};