var splunkBunyan = require("../index");
var assert = require("assert");

/** Unit tests **/

// TODO: test levels

describe("createStream", function() {
    it("should error without config", function() {
        try {
            splunkBunyan.createStream();
            assert.ok(false, "Expected an error.");
        }
        catch(err) {
            assert.ok(err);
            assert.strictEqual(err.message, "Config is required.");
        }
    });
    it("should error without config", function() {
        var config = {};
        try {
            splunkBunyan.createStream(config);
            assert.ok(false, "Expected an error.");
        }
        catch(err) {
            assert.ok(err);
            assert.strictEqual(err.message, "Config object must have a token.");
        }
    });
    it("should create logger with minimal config", function() {
        var config = {
            token: "a-token-goes-here-usually"
        };
        var splunkBunyanStream = splunkBunyan.createStream(config);

        assert.ok(splunkBunyanStream);
        assert.strictEqual("info", splunkBunyanStream.level);
        assert.strictEqual("raw", splunkBunyanStream.type);
        assert.ok(splunkBunyanStream.hasOwnProperty("stream"));
        assert.ok(splunkBunyanStream.stream.hasOwnProperty("logger"));
        assert.ok(splunkBunyanStream.stream.logger.hasOwnProperty("config"));
        assert.ok(splunkBunyanStream.stream.hasOwnProperty("send"));
        assert.strictEqual(config.token, splunkBunyanStream.stream.config().token);
        assert.strictEqual("splunk-bunyan-logger/0.8.0", splunkBunyanStream.stream.config().name);
        assert.strictEqual("localhost", splunkBunyanStream.stream.config().host);
        assert.strictEqual("/services/collector/event/1.0", splunkBunyanStream.stream.config().path);
        assert.strictEqual("https", splunkBunyanStream.stream.config().protocol);
        assert.strictEqual("info", splunkBunyanStream.stream.config().level);
        assert.strictEqual(8088, splunkBunyanStream.stream.config().port);
        assert.strictEqual("off", splunkBunyanStream.stream.config().batching);
    });
    it("should create logger with manual batching enabled", function() {
        var config = {
            token: "a-token-goes-here-usually",
            batching: "manual"
        };
        var splunkBunyanStream = splunkBunyan.createStream(config);

        assert.ok(splunkBunyanStream);
        assert.strictEqual("info", splunkBunyanStream.level);
        assert.strictEqual("raw", splunkBunyanStream.type);
        assert.ok(splunkBunyanStream.hasOwnProperty("stream"));
        assert.ok(splunkBunyanStream.stream.hasOwnProperty("logger"));
        assert.ok(splunkBunyanStream.stream.logger.hasOwnProperty("config"));
        assert.ok(splunkBunyanStream.stream.hasOwnProperty("send"));
        assert.strictEqual(config.token, splunkBunyanStream.stream.config().token);
        assert.strictEqual("splunk-bunyan-logger/0.8.0", splunkBunyanStream.stream.config().name);
        assert.strictEqual("localhost", splunkBunyanStream.stream.config().host);
        assert.strictEqual("/services/collector/event/1.0", splunkBunyanStream.stream.config().path);
        assert.strictEqual("https", splunkBunyanStream.stream.config().protocol);
        assert.strictEqual("info", splunkBunyanStream.stream.config().level);
        assert.strictEqual(8088, splunkBunyanStream.stream.config().port);
        assert.strictEqual("manual", splunkBunyanStream.stream.config().batching);
    });
    it("should create logger with non-default name", function() {
        var config = {
            token: "a-token-goes-here-usually",
            name: "different name"
        };
        var splunkBunyanStream = splunkBunyan.createStream(config);

        assert.ok(splunkBunyanStream);
        assert.strictEqual("info", splunkBunyanStream.level);
        assert.strictEqual("raw", splunkBunyanStream.type);
        assert.ok(splunkBunyanStream.hasOwnProperty("stream"));
        assert.ok(splunkBunyanStream.stream.hasOwnProperty("logger"));
        assert.ok(splunkBunyanStream.stream.logger.hasOwnProperty("config"));
        assert.ok(splunkBunyanStream.stream.hasOwnProperty("send"));
        assert.strictEqual(config.token, splunkBunyanStream.stream.config().token);
        assert.strictEqual(config.name, splunkBunyanStream.stream.config().name);
        assert.strictEqual("localhost", splunkBunyanStream.stream.config().host);
        assert.strictEqual("/services/collector/event/1.0", splunkBunyanStream.stream.config().path);
        assert.strictEqual("https", splunkBunyanStream.stream.config().protocol);
        assert.strictEqual("info", splunkBunyanStream.stream.config().level);
        assert.strictEqual(8088, splunkBunyanStream.stream.config().port);
    });
    it("should create logger with non-default path", function() {
        var config = {
            token: "a-token-goes-here-usually",
            path: "/services/collector/different/1.0"
        };
        var splunkBunyanStream = splunkBunyan.createStream(config);

        assert.ok(splunkBunyanStream);
        assert.strictEqual("info", splunkBunyanStream.level);
        assert.strictEqual("raw", splunkBunyanStream.type);
        assert.ok(splunkBunyanStream.hasOwnProperty("stream"));
        assert.ok(splunkBunyanStream.stream.hasOwnProperty("logger"));
        assert.ok(splunkBunyanStream.stream.logger.hasOwnProperty("config"));
        assert.ok(splunkBunyanStream.stream.hasOwnProperty("send"));
        assert.strictEqual(config.token, splunkBunyanStream.stream.config().token);
        assert.strictEqual("splunk-bunyan-logger/0.8.0", splunkBunyanStream.stream.config().name);
        assert.strictEqual("localhost", splunkBunyanStream.stream.config().host);
        assert.strictEqual(config.path, splunkBunyanStream.stream.config().path);
        assert.strictEqual("https", splunkBunyanStream.stream.config().protocol);
        assert.strictEqual("info", splunkBunyanStream.stream.config().level);
        assert.strictEqual(8088, splunkBunyanStream.stream.config().port);
    });
    it("should create logger with non-default middleware", function() {
        var config = {
            token: "a-token-goes-here-usually"
        };
        var splunkBunyanStream = splunkBunyan.createStream(config);

        splunkBunyanStream.use(function(data, next) {
            next(null, data);
        });

        assert.ok(splunkBunyanStream);
        assert.strictEqual("info", splunkBunyanStream.level);
        assert.strictEqual("raw", splunkBunyanStream.type);
        assert.ok(splunkBunyanStream.hasOwnProperty("stream"));
        assert.ok(splunkBunyanStream.stream.hasOwnProperty("logger"));
        assert.ok(splunkBunyanStream.stream.logger.hasOwnProperty("config"));
        assert.ok(splunkBunyanStream.stream.hasOwnProperty("send"));
        assert.strictEqual(config.token, splunkBunyanStream.stream.config().token);
        assert.strictEqual("splunk-bunyan-logger/0.8.0", splunkBunyanStream.stream.config().name);
        assert.strictEqual("localhost", splunkBunyanStream.stream.config().host);
        assert.strictEqual("/services/collector/event/1.0", splunkBunyanStream.stream.config().path);
        assert.strictEqual(config.middleware, splunkBunyanStream.stream.config().middleware);
        assert.strictEqual("https", splunkBunyanStream.stream.config().protocol);
        assert.strictEqual("info", splunkBunyanStream.stream.config().level);
        assert.strictEqual(8088, splunkBunyanStream.stream.config().port);
    });
});