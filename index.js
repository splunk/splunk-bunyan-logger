var Stream = require("stream").Writable;
var util = require("util");
var url = require("url");

var SplunkLogger = require("splunk-logging");

// Default callbacks
function _error(err) {
    console.log("Error in splunk-bunyan-logger:", err);
}

function _send(err, resp, body) {
    if (err) {
        console.log("Error when sending request from splunk-bunyan-logger:", err);
    }
}

function _end(callback) {
    callback();
}

/** 
 * TODO: docs
 * SplunkStream - a class that implements a writable stream
 */
var SplunkStream = function (config) {
    this.logger = new SplunkLogger(config);

    // If using the common logger's default name, change it
    if (this.logger.config.name === "splunk-javascript-logging/0.8.0") {
        this.logger.config.name = "splunk-bunyan-logger/0.8.0";
    }

    this.error = _error;
    this.send = _send;
    this.end = _end;
    SplunkStream.prototype.on("error", this.error);
    SplunkStream.prototype.on("end", this.end);
    
};
util.inherits(SplunkStream, Stream);

/**
 * TODO: docs
 * Returns the configuration for this logger
 */
SplunkStream.prototype.config = function() {
    return this.logger.config;
};

/**
 * TODO: docs

 * Since this is implemented as a "raw" stream, we get passed a full JS object - a single log event
 * if user calls Logger.info({"some": "value"}); then the msg field will be an empty string
 * any keys on that object will be at the top level of the JSON
 *
 * The config parameter is optional, and can be overridden per event
 */
SplunkStream.prototype.write = function (settings) {    
    if (!settings) {
        this.emit("error", new Error("Must pass a parameter to write."));
        return;
    }

    var config = this.logger._initializeConfig(settings.config || this.config());

    var data = settings.data;
    // Special case, none of the expected keys are found, so treat settings as the data
    if (!settings.hasOwnProperty("data") && 
             !settings.hasOwnProperty("config") &&
             !settings.hasOwnProperty("requestOptions")) {
        data = settings;
    }


    // TODO: for the time, run Date.parse(event.time) / 1000; // to strip out the ms
    /** Values provided by Bunyan
     * v: Required. Integer. Added by Bunyan. Cannot be overriden.
     *      This is the Bunyan log format version (require('bunyan').LOG_VERSION).
     *      The log version is a single integer. 0 is until I release a version "1.0.0" of node-bunyan.
     *      Thereafter, starting with 1, this will be incremented if there is any backward incompatible change
     *      to the log record format.
     *      Details will be in "CHANGES.md" (the change log).
     * level: Required. Integer. Added by Bunyan. Cannot be overriden. See the "Levels" section.
     * name: Required. String. Provided at Logger creation.
     *      You must specify a name for your logger when creating it.
     *      Typically this is the name of the service/app using Bunyan for logging.
     * hostname: Required. String. Provided or determined at Logger creation.
     *      You can specify your hostname at Logger creation or it will be retrieved vi os.hostname().
     * pid: Required. Integer. Filled in automatically at Logger creation.
     * time: Required. String. Added by Bunyan. Can be overriden.
     *      The date and time of the event in ISO 8601 Extended Format format and in UTC, as from Date.toISOString().
     * msg: Required. String. Every log.debug(...) et al call must provide a log message.
     * src: Optional. Object giving log call source info.
     *      This is added automatically by Bunyan if the "src: true" config option is given to the Logger.
     *      Never use in production as this is really slow.
     *
     * {
     *      name: 'foo',
     *      hostname: 'machinename.local',
     *      pid: 25767,
     *      level: 30,
     *      msg: '',
     *      time: Wed Aug 12 2015 15:22:22 GMT-0700 (PDT),
     *      v: 0
     *  }
     */

    // TODO: add a test passing through the this.error callback somehow
    var param = {
        config: config,
        data: data
    };
    this.logger.send(param, this.send);
};

module.exports =  {
    /**
     * TODO: docs
     */
    levels: {
        info: "info"
    },
    /**
     * TODO: docs
     *
     */
    createStream: function (config) {
        var stream =  new SplunkStream(config);
        return {
            level: config.level || this.levels.info,
            type: "raw",
            /**
             * TODO: docs 
             * Adds a middleware to the SplunkLogger for this instance
             * Just a convenience method for the common logging interface
             */
            use: function(middleware) {
                this.stream.logger.use(middleware);
            },
            stream: stream
        };
    }
};