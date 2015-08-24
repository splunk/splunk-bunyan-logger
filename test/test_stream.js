var splunkBunyan = require("../index");
var assert = require("assert");

/** Integration Tests **/ 

/**
 * Load test configuration from test/config.json
 * It just needs a token:
 *
 *     {"token": "token-goes-here"}
 *
 */
var configurationFile = require("./config.json");

var invalidTokenBody = {
    text: "Invalid token",
    code: 4
};

var successBody = {
    text: "Success",
    code: 0
};

describe("SplunkStream", function() {
    it("should write a string", function(done) {
        var config = {
            token: configurationFile.token
        };

        var splunkBunyanStream = splunkBunyan.createStream(config);

        assert.ok(splunkBunyanStream);
        assert.strictEqual("info", splunkBunyanStream.level);
        assert.strictEqual("raw", splunkBunyanStream.type);
        assert.strictEqual(config.token, splunkBunyanStream.stream.config().token);
        assert.strictEqual("splunk-bunyan-logger/0.8.0", splunkBunyanStream.stream.config().name);
        assert.strictEqual("localhost", splunkBunyanStream.stream.config().host);
        assert.strictEqual("https", splunkBunyanStream.stream.config().protocol);
        assert.strictEqual(false, splunkBunyanStream.stream.config().strictSSL);
        assert.strictEqual("info", splunkBunyanStream.stream.config().level);
        assert.strictEqual(8088, splunkBunyanStream.stream.config().port);

        var data = "something";

        splunkBunyanStream.stream.write(data);
        splunkBunyanStream.stream.end(done);
    });
    it("should write a string when config is also passed", function(done) {
        var config = {
            token: configurationFile.token
        };

        var splunkBunyanStream = splunkBunyan.createStream(config);

        assert.ok(splunkBunyanStream);
        assert.strictEqual("info", splunkBunyanStream.level);
        assert.strictEqual("raw", splunkBunyanStream.type);
        assert.strictEqual(config.token, splunkBunyanStream.stream.config().token);
        assert.strictEqual("splunk-bunyan-logger/0.8.0", splunkBunyanStream.stream.config().name);
        assert.strictEqual("localhost", splunkBunyanStream.stream.config().host);
        assert.strictEqual("https", splunkBunyanStream.stream.config().protocol);
        assert.strictEqual(false, splunkBunyanStream.stream.config().strictSSL);
        assert.strictEqual("info", splunkBunyanStream.stream.config().level);
        assert.strictEqual(8088, splunkBunyanStream.stream.config().port);

        var data = "something";

        splunkBunyanStream.stream.write(config, data);
        splunkBunyanStream.stream.end(done);
    });
    it("should call default error callback", function(done) {
        var config = {
            token: configurationFile.token
        };

        var splunkBunyanStream = splunkBunyan.createStream(config);
        splunkBunyanStream.use(function(data, next) {
            next(new Error("this is an error!"));
        });

        splunkBunyanStream.stream.write("something");
        splunkBunyanStream.stream.end(done);
    });
});