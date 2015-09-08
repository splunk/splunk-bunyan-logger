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
    it("should error sending data to invalid url, caught by custom stream.error", function(done) {
        var config = {
            url: "https://invalid.server:8088/services/collector/invalid/1.0",
            token: "does-not-matter"
        };
        var splunkBunyanStream = SplunkBunyan.createStream(config);

        splunkBunyanStream.stream.on("error", function(err, context) {
            assert.ok(err);
            assert.ok(context);
            assert.strictEqual(err.code, "ENOTFOUND");
            assert.strictEqual(err.errno, "ENOTFOUND");
            assert.strictEqual(err.message, "getaddrinfo ENOTFOUND");
            done();
        });

        var Logger = bunyan.createLogger({
            name: "a bunyan logger",
            streams: [
                splunkBunyanStream
            ]
        });

        Logger.info("this is a test statement");
    });
    it("should error sending data with invalid token", function(done) {
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
    it("should succeed in sending data as trace with valid token", function(done) {
        var splunkBunyanStream = SplunkBunyan.createStream({
            token: configurationFile.token,
            level: "trace"
        });

        var run = false;

        // Override the default send function
        splunkBunyanStream.stream.send = function(err, resp, body) {
            assert.ok(!err);
            assert.ok(run);
            assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
            assert.strictEqual(resp.body, body);
            assert.strictEqual(body.text, successBody.text);
            assert.strictEqual(body.code, successBody.code);
            done();
        };

        // Wrap the write function to test that the level works
        var write = splunkBunyanStream.stream.write;
        splunkBunyanStream.stream.write = function(data) {
            run = true;
            assert.ok(data);
            assert.strictEqual(data.level, 10);
            splunkBunyanStream.stream.write = write;
            this.write(data);
        };

        var Logger = bunyan.createLogger({
            name: "a bunyan logger",
            streams: [
                splunkBunyanStream
            ]
        });

        Logger.trace("this is a test statement");
    });
    it("should succeed in sending data as debug with valid token", function(done) {
        var splunkBunyanStream = SplunkBunyan.createStream({
            token: configurationFile.token,
            level: "debug"
        });

        var run = false;

        // Override the default send function
        splunkBunyanStream.stream.send = function(err, resp, body) {
            assert.ok(!err);
            assert.ok(run);
            assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
            assert.strictEqual(resp.body, body);
            assert.strictEqual(body.text, successBody.text);
            assert.strictEqual(body.code, successBody.code);
            done();
        };

        // Wrap the write function to test that the level works
        var write = splunkBunyanStream.stream.write;
        splunkBunyanStream.stream.write = function(data) {
            run = true;
            assert.ok(data);
            assert.strictEqual(data.level, 20);
            splunkBunyanStream.stream.write = write;
            this.write(data);
        };

        var Logger = bunyan.createLogger({
            name: "a bunyan logger",
            streams: [
                splunkBunyanStream
            ],
            level: "debug"
        });

        Logger.debug("this is a test statement");
    });
    it("should succeed in sending data as info with valid token", function(done) {
        var splunkBunyanStream = SplunkBunyan.createStream(configurationFile);

        var run = false;

        // Override the default send function
        splunkBunyanStream.stream.send = function(err, resp, body) {
            assert.ok(!err);
            assert.ok(run);
            assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
            assert.strictEqual(resp.body, body);
            assert.strictEqual(body.text, successBody.text);
            assert.strictEqual(body.code, successBody.code);
            done();
        };

        // Wrap the write function to test that the level works
        var write = splunkBunyanStream.stream.write;
        splunkBunyanStream.stream.write = function(data) {
            run = true;
            assert.ok(data);
            assert.strictEqual(data.level, 30);
            splunkBunyanStream.stream.write = write;
            this.write(data);
        };

        var Logger = bunyan.createLogger({
            name: "a bunyan logger",
            streams: [
                splunkBunyanStream
            ]
        });

        Logger.info("this is a test statement");
    });
    it("should succeed in sending data as warn with valid token", function(done) {
        var splunkBunyanStream = SplunkBunyan.createStream(configurationFile);

        var run = false;

        // Override the default send function
        splunkBunyanStream.stream.send = function(err, resp, body) {
            assert.ok(!err);
            assert.ok(run);
            assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
            assert.strictEqual(resp.body, body);
            assert.strictEqual(body.text, successBody.text);
            assert.strictEqual(body.code, successBody.code);
            done();
        };

        // Wrap the write function to test that the level works
        var write = splunkBunyanStream.stream.write;
        splunkBunyanStream.stream.write = function(data) {
            run = true;
            assert.ok(data);
            assert.strictEqual(data.level, 40);
            splunkBunyanStream.stream.write = write;
            this.write(data);
        };


        var Logger = bunyan.createLogger({
            name: "a bunyan logger",
            streams: [
                splunkBunyanStream
            ]
        });

        Logger.warn("this is a test statement");
    });
    it("should succeed in sending data as error with valid token", function(done) {
        var splunkBunyanStream = SplunkBunyan.createStream(configurationFile);

        var run = false;

        // Override the default send function
        splunkBunyanStream.stream.send = function(err, resp, body) {
            assert.ok(!err);
            assert.ok(run);
            assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
            assert.strictEqual(resp.body, body);
            assert.strictEqual(body.text, successBody.text);
            assert.strictEqual(body.code, successBody.code);
            done();
        };

        // Wrap the write function to test that the level works
        var write = splunkBunyanStream.stream.write;
        splunkBunyanStream.stream.write = function(data) {
            run = true;
            assert.ok(data);
            assert.strictEqual(data.level, 50);
            splunkBunyanStream.stream.write = write;
            this.write(data);
        };

        var Logger = bunyan.createLogger({
            name: "a bunyan logger",
            streams: [
                splunkBunyanStream
            ],
            level: "error"
        });

        Logger.error("this is a test statement");
    });
    it("should succeed in sending data as fatal with valid token", function(done) {
        var splunkBunyanStream = SplunkBunyan.createStream(configurationFile);

        var run = false;

        // Override the default send function
        splunkBunyanStream.stream.send = function(err, resp, body) {
            assert.ok(!err);
            assert.ok(run);
            assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
            assert.strictEqual(resp.body, body);
            assert.strictEqual(body.text, successBody.text);
            assert.strictEqual(body.code, successBody.code);
            done();
        };

        // Wrap the write function to test that the level works
        var write = splunkBunyanStream.stream.write;
        splunkBunyanStream.stream.write = function(data) {
            run = true;
            assert.ok(data);
            assert.strictEqual(data.level, 60);
            splunkBunyanStream.stream.write = write;
            this.write(data);
        };

        var Logger = bunyan.createLogger({
            name: "a bunyan logger",
            streams: [
                splunkBunyanStream
            ],
            level: "fatal"
        });

        Logger.fatal("this is a test statement");
    });
    it("should succeed in sending array data with valid token", function(done) {
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

        Logger.info([1, 2, 3]);
    });
    it("should succeed in sending context as object with valid token", function(done) {
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

        var context = {
            data: "1233312124"
        };
        Logger.info(context);
    });
    it("should succeed in sending data twice with valid token", function(done) {
        var splunkBunyanStream = SplunkBunyan.createStream(configurationFile);

        var count = 0;

        // Override the default send function
        splunkBunyanStream.stream.send = function(err, resp, body) {
            count++;
            assert.ok(!err);
            assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
            assert.strictEqual(resp.body, body);
            assert.strictEqual(body.text, successBody.text);
            assert.strictEqual(body.code, successBody.code);
            if (count === 2) {
                done();
            }
        };

        var Logger = bunyan.createLogger({
            name: "a bunyan logger",
            streams: [
                splunkBunyanStream
            ]
        });

        Logger.info("this is a test statement");
        Logger.info("this is a test statement");
    });
    it("should succeed in sending data twice with valid token", function(done) {
        var config = {
            token: configurationFile.token,
            batching: "manual"
        };
        var splunkBunyanStream = SplunkBunyan.createStream(config);

        var run = false;

        // Wrap the default send function
        var send = splunkBunyanStream.stream.send;
        splunkBunyanStream.stream.send = function(err, resp, body) {
            run = true;
            send(err, resp, body);
        };

        var Logger = bunyan.createLogger({
            name: "a bunyan logger",
            streams: [
                splunkBunyanStream
            ]
        });

        assert.strictEqual(splunkBunyanStream.stream.logger.contextQueue.length, 0);
        Logger.info("this is a test statement");
        assert.strictEqual(splunkBunyanStream.stream.logger.contextQueue.length, 1);
        Logger.info("this is a test statement");
        assert.strictEqual(splunkBunyanStream.stream.logger.contextQueue.length, 2);

        splunkBunyanStream.flush(function(err, resp, body) {
            assert.ok(!err);
            assert.ok(run);
            assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
            assert.strictEqual(resp.body, body);
            assert.strictEqual(body.text, successBody.text);
            assert.strictEqual(body.code, successBody.code);
            done();
        });
    });
    // TODO: add a test with middleware throwing error, then getting the context
});
