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

// TODO: remove?
// Backup console.log so we can restore it later
var ___log = console.log;
/**
 * Silences console.log
 * Undo this effect by calling unmute().
 */
function mute() {
    console.log = function(){};
}

/**
 * Un-silences console.log
 */
function unmute() {
    console.log = ___log;
}

function formatForBunyan(data) {
    var ret = {
        name: "a bunyan logger",
        hostname: "Shaqbook-15.local",
        pid: 37509,
        level: 30,
        msg: "",
        time: Date.now() / 1000, // The / 1000 part is for Splunk
        v: 0
    };

    if (typeof data === "string") {
        ret.msg = data;
    }
    else {
        for (var key in data) {
            ret[key] = data[key];
        }
    }

    return ret;
}

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
        assert.strictEqual("off", splunkBunyanStream.stream.config().batching);

        var sendCallback = splunkBunyanStream.stream.send;
        splunkBunyanStream.stream.send = function(err, resp, body) {
            assert.strictEqual(body.text, successBody.text);
            assert.strictEqual(body.code, successBody.code);
            sendCallback(err, resp, body);
            done();
        };

        var data = "something";

        splunkBunyanStream.stream.write(formatForBunyan(data));
    });
    it("should emit error from middleware", function(done) {
        var config = {
            token: configurationFile.token
        };
        var splunkBunyanStream = splunkBunyan.createStream(config);

        var run = false;

        splunkBunyanStream.use(function(context, next) {
            run = true;
            next(new Error("this is an error!"));
        });

        splunkBunyanStream.stream.on("error", function(err) {
            assert.ok(run);
            assert.ok(err);
            assert.strictEqual(err.message, "this is an error!");
            done();
        });

        splunkBunyanStream.stream.write(formatForBunyan("something"));
    });
    it("should emit error when writing without args", function(done) {
        var config = {
            token: configurationFile.token
        };
        var splunkBunyanStream = splunkBunyan.createStream(config);

        splunkBunyanStream.stream.on("error", function(err) {
            assert.ok(err);
            assert.strictEqual(err.message, "Must pass a parameter to write.");
            done();
        });
        splunkBunyanStream.stream.write();
    });
});