var Stream = require("stream").Writable;
var util = require("util");
var url = require("url");

var SplunkLogger = require("splunk-logging");

var levels = {
    trace: "trace",
    debug: "debug",
    info: "info",
    warn: "warn",
    error: "error",
    fatal: "fatal"
};

/**
 * TODO: docs
 * 
 * Translates bunyan logging level number to name of the level.
 *
 */
function severityFromLevel(level) {
    switch(level) {
        case 10:
            return levels.trace;
        case 20:
            return levels.debug;
        case 40:
            return levels.warn;
        case 50:
            return levels.error;
        case 60:
            return levels.fatal;
        default:
            return levels.info;
    }
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

    // Overwrite the common error callback
    var that = this;
    this.logger.error = function(err) {
        that.emit("error", err);
    };

    // Default callback is noop
    this.send = function(err, resp, body) {};
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
SplunkStream.prototype.write = function (data) {
    if (!data) {
        this.emit("error", new Error("Must pass a parameter to write."));
        return;
    }

    // TODO: remove after addressing all questions.
    /** Unparsed values provided by Bunyan
     * v: Required. Integer. Added by Bunyan. Cannot be overriden.
     *      This is the Bunyan log format version (require('bunyan').LOG_VERSION).
     *      The log version is a single integer. 0 is until I release a version "1.0.0" of node-bunyan.
     *      Thereafter, starting with 1, this will be incremented if there is any backward incompatible change
     *      to the log record format.
     *      Details will be in "CHANGES.md" (the change log).
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


    // TODO: answer these questions about bunyan's provided fields
    // TODO: data.name, should this overwrite this.config().name?
    // TODO: data.msg === "" when doing Logger.info({some: "value"})
    //      do we want to delete data.msg?

    var context = {
        data: data,
        severity: severityFromLevel(data.level),
        time: data.time,
        host: data.hostname
    };

    // Remove properties already added to the context
    // TODO: should these deletes be configurable?
    delete context.data.level;
    delete context.data.time;
    delete context.data.hostname;
    delete context.data.severity;

    // Clean up any existing metadata
    // TODO: should the deletes be configurable?
    if (data.host) {
        // TODO: Do we want this for host? This will override the hostname provided by Bunyan
        context.host = data.host;
        delete data.host;
    }
    if (data.source) {
        context.source = data.source;
        delete data.source;
    }
    if (data.sourcetype) {
        context.sourcetype = data.sourcetype;
        delete data.sourcetype;
    }
    if (data.index) {
        context.index = data.index;
        delete data.index;
    }

    var that = this;
    this.logger.send(context, function(err, resp, body) {
        if (err) {
            that.emit("error", err, that.logger._initializeContext(context));
        }
        else {
            that.send(err, resp, body);
        }
    });
};

module.exports =  {
    /**
     * TODO: docs
     */
    levels: levels,
    /**
     * TODO: docs
     *
     */
    createStream: function (config) {
        var stream =  new SplunkStream(config);
        return {
            /**
             * TODO: docs
             * The logging level name for Bunyan, defaults to info.
             */
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
            /**
             * TODO: docs
             *
             * Syntactical sugar
             */
            on: function(event, callback) {
                this.stream.on(event, callback);
            },
            /**
             * TODO: docs
             *
             */
            flush: function(callback) {
                this.stream.logger.flush(callback);
            },
            stream: stream
        };
    }
};