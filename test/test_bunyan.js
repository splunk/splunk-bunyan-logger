var SplunkBunyan = require("../index");
var assert = require("assert");
var bunyan = require("bunyan");

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

describe("Bunyan", function() {
    it("should create logger with SplunkStream", function() {
        var splunkBunyanStream = SplunkBunyan.createStream(configurationFile);

        assert.ok(splunkBunyanStream);

        var Logger = bunyan.createLogger({
            name: "a bunyan logger",
            streams: [ 
                splunkBunyanStream
            ]
        });

        assert.ok(Logger);
        assert.strictEqual("a bunyan logger", Logger.fields.name);
        assert.strictEqual(1, Logger.streams.length);
        assert.strictEqual(splunkBunyanStream.stream, Logger.streams[0].stream);
    });
    it("should create logger with SplunkStream and middleware", function() {
        var splunkBunyanStream = SplunkBunyan.createStream(configurationFile);

        assert.ok(splunkBunyanStream);

        var calledMiddleware = false;

        function middleware(context, next) {
            calledMiddleware = true;
            next(null, context);
        }

        splunkBunyanStream.use(middleware);

        assert.strictEqual(middleware, splunkBunyanStream.stream.logger.middlewares[0]);

        var Logger = bunyan.createLogger({
            name: "a bunyan logger",
            streams: [ 
                splunkBunyanStream
            ]
        });

        assert.ok(Logger);
        assert.strictEqual("a bunyan logger", Logger.fields.name);
        assert.strictEqual(1, Logger.streams.length);
        assert.strictEqual(splunkBunyanStream.stream, Logger.streams[0].stream);
    });
    
    // TODO: this tests passes trivially, other tests are emitting the error
    //       event, which make the error event here fire. BAD BAD BAD.    
    // it("should fail sending data to invalid url, caught by stream.send", function(done) {
    //     this.timeout(5000);
    //     var config = {
    //         url: "https://invalid.server:8088/services/collector/invalid/1.0",
    //         token: "does-not-matter"
    //     };
    //     var splunkBunyanStream = SplunkBunyan.createStream(config);

    //     var run = false;

    //     var errCallback = splunkBunyanStream.stream.error;
    //     splunkBunyanStream.stream.on("error", function(err) {
    //         run = true;
    //         assert.ok(err);
    //         console.log("\t\t\t\therererweorihasoeifhaspdfhasdiasdifhsa");
    //         console.log(err);
    //         // assert.strictEqual("ENOTFOUND", err.code);
    //         // assert.strictEqual("ENOTFOUND", err.errno);
    //     });

    //     var Logger = bunyan.createLogger({
    //         name: "a bunyan logger",
    //         streams: [
    //             splunkBunyanStream
    //         ]
    //     });

    //     Logger.info("this is a test statement");
        
    //     setTimeout(function() {
    //         // assert.ok(run);
    //         splunkBunyanStream.stream.end(done);
    //     }, 1000);
    // });

    it("should fail sending data to invalid url, caught by stream.error", function() {
        var config = {
            url: "https://invalid.server:8088/services/collector/invalid/1.0",
            token: "does-not-matter"
        };
        var splunkBunyanStream = SplunkBunyan.createStream(config);

        // splunkBunyanStream.stream.emit("error", "something");

        var Logger = bunyan.createLogger({
            name: "a bunyan logger",
            streams: [
                splunkBunyanStream
            ]
        });

        Logger.info("this is a test statement");
        // TODO: actually test
    });

    it("should fail sending data to invalid url, caught by custom stream.send", function(done) {
        // TODO: update tests like this to use a custom error handler which writes to a string, buffer or duplex stream
        var config = {
            url: "https://invalid.server:8088/services/collector/invalid/1.0",
            token: "does-not-matter"
        };
        var splunkBunyanStream = SplunkBunyan.createStream(config);

        // Override the default send function
        splunkBunyanStream.stream.send = function(err, resp, body) {
            assert.ok(err);
            assert.ok(!resp);
            assert.ok(!body);
            done();
        };

        var Logger = bunyan.createLogger({
            name: "a bunyan logger",
            streams: [
                splunkBunyanStream
            ]
        });

        Logger.info("this is a test statement");
        // TODO: actually test
    });

    it("should fail sending data to invalid url, caught by custom stream.error", function(done) {
        var config = {
            url: "https://invalid.server:8088/services/collector/invalid/1.0",
            token: "does-not-matter"
        };
        var splunkBunyanStream = SplunkBunyan.createStream(config);

        var called = false;

        var onError = function(err) {
            called = true;
            assert.ok(err);
            assert.ok(called);
        };

        // Override the default error function
        splunkBunyanStream.stream.on("error", onError);

        // Override the default send function
        splunkBunyanStream.stream.send = function(err, resp, body) {
            if (err) {
                onError(err);
            }
        };

        var Logger = bunyan.createLogger({
            name: "a bunyan logger",
            streams: [
                splunkBunyanStream
            ]
        });

        Logger.info("this is a test statement");
        // TODO: actually test
        splunkBunyanStream.stream.end(done);
    });

    it("should fail sending data with invalid token", function(done) {
        var splunkBunyanStream = SplunkBunyan.createStream({token: "bad-token"});

        // Override the default send function
        splunkBunyanStream.stream.send = function(err, resp, body) {
            assert.ok(!err);
            assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
            assert.strictEqual(resp.body, body);
            assert.strictEqual(body.text, invalidTokenBody.text);
            assert.strictEqual(body.code, invalidTokenBody.code);
            done();
        };

        var Logger = bunyan.createLogger({
            name: "a bunyan logger",
            streams: [
                splunkBunyanStream
            ]
        });

        Logger.info("this is a test statement");
    });

    it("should succeed in sending data with valid token", function(done) {
        var splunkBunyanStream = SplunkBunyan.createStream(configurationFile);

        // Override the default send function
        splunkBunyanStream.stream.send = function(err, resp, body) {
            assert.ok(!err);
            assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
            assert.strictEqual(resp.body, body);
            assert.strictEqual(body.text, successBody.text);
            assert.strictEqual(body.code, successBody.code);
            done();
        };

        var Logger = bunyan.createLogger({
            name: "a bunyan logger",
            streams: [
                splunkBunyanStream
            ]
        });

        Logger.info("this is a test statement");
    });
});
