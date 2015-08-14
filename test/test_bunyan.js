var splunkBunyan = require("../index");
var assert = require("assert");
var bunyan = require("bunyan");

/** Unit Tests **/ 

/**
 * Load test configuration from test/config.json
 * It just needs a token:
 *
 *     {"token": "token-goes-here"}
 *
 */
var configurationFile = require("./config.json");

describe("Test config file 'config.json'", function() {
    it("should at least have a token", function() {
        assert.ok(configurationFile);
        assert.ok(configurationFile.hasOwnProperty("token"));
        assert.ok(configurationFile.token.length > 0);
    });
});

describe("Bunyan", function() {
    it("should create logger with SplunkStream", function() {
        var splunkBunyanStream = splunkBunyan.createStream(configurationFile);

        assert.ok(splunkBunyanStream);

        var Logger = bunyan.createLogger({
            name: "my bunyan logger",
            streams: [ 
                splunkBunyanStream
            ]
        });

        assert.ok(Logger);
        assert.strictEqual("my bunyan logger", Logger.fields.name);
        assert.strictEqual(1, Logger.streams.length);
        assert.strictEqual(splunkBunyanStream.stream, Logger.streams[0].stream);
    });
});

/** TODO: Integration Tests **/ 