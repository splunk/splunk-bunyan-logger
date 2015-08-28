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
        assert.strictEqual("info", splunkBunyanStream.stream.config().level);
        assert.strictEqual(8088, splunkBunyanStream.stream.config().port);

        var data = "something";

        var settings = {
            data: data,
            config: config
        };

        splunkBunyanStream.stream.write(settings);
        splunkBunyanStream.stream.end(done);
    });
    it("should call default error callback", function(done) {
        var config = {
            token: configurationFile.token
        };
        var run = false;
        var splunkBunyanStream = splunkBunyan.createStream(config);
        splunkBunyanStream.use(function(settings, next) {
            run = true;
            next(new Error("this is an error!"));
        });

        splunkBunyanStream.stream.write("something");
        assert.ok(run);     
        splunkBunyanStream.stream.end(done);
    });
    it("should error when writing without args", function(done) {
        var config = {
            token: configurationFile.token
        };
        var run = false;
        var splunkBunyanStream = splunkBunyan.createStream(config);
        splunkBunyanStream.stream.on("error", function(err) {
            run = true;
        });
        splunkBunyanStream.stream.write();
        
        splunkBunyanStream.stream.end(function() {
            assert.ok(run);
            done();
        });
    });
});