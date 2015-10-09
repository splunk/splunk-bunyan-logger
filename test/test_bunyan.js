/*
 * Copyright 2015 Splunk, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"): you may
 * not use this file except in compliance with the License. You may obtain
 * a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */

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

var successBody = {
    text: "Success",
    code: 0
};

var invalidTokenBody = {
    text: "Invalid token",
    code: 4
};

// TODO: test unsuccessfully sending to another index with specific index token settings
// var incorrectIndexBody = {
//     text: "Incorrect index",
//     code: 7,
//     "invalid-event-number": 1
// };

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
        assert.strictEqual(bunyan.resolveLevel("info"), Logger.level());
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

        splunkBunyanStream.on("error", function(err, context) {
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

        var run = false;

        // Override the default send function
        splunkBunyanStream.stream.send = function(err, resp, body) {
            assert.ok(!err);
            assert.ok(run);
            assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
            assert.strictEqual(resp.body, body);
            assert.strictEqual(body.text, invalidTokenBody.text);
            assert.strictEqual(body.code, invalidTokenBody.code);
            done();
        };

        splunkBunyanStream.on("error", function(err, context) {
            run = true;
            assert.ok(err);
            assert.strictEqual(err.message, invalidTokenBody.text);
            assert.strictEqual(err.code, invalidTokenBody.code);
            assert.ok(context);
            assert.strictEqual(context.message.msg, "this is a test statement");
        });

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
    it("should succeed in sending data with valid token using custom time", function(done) {
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

        Logger.info({time: Date.parse("Jan 01, 2015")}, "custom time");
    });
    it("should succeed in sending data with valid token using custom host", function(done) {
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

        Logger.info({host: "different.host.local"}, "custom host");
    });
    it("should succeed in sending data with valid token using custom source", function(done) {
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

        Logger.info({source: "different_source"}, "custom source");
    });
    it("should succeed in sending data with valid token using custom sourcetype", function(done) {
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

        Logger.info({sourcetype: "different_sourcetype"}, "custom sourcetype");
    });
    it("should succeed in sending data with valid token to any index", function(done) {
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

        Logger.info({index: "_____different_index"}, "custom index");
    });
    // TODO: test successfully sending to another index
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
    it("should succeed in sending data as object with valid token", function(done) {
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

        var data = {
            something: "1233312124"
        };
        Logger.info(data);
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
    it("should succeed in sending data twice with valid token with autoFlush off", function(done) {
        var config = {
            token: configurationFile.token,
            autoFlush: false
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
    it("should get context when middleware calls next(error)", function(done) {
        var splunkBunyanStream = SplunkBunyan.createStream(configurationFile);

        var run = false;

        splunkBunyanStream.use(function(context, next) {
            run = true;
            assert.ok(context);
            next(new Error("Not passing context"));
        });

        splunkBunyanStream.on("error", function(err) {
            assert.ok(run);
            assert.ok(err);
            assert.strictEqual(err.message, "Not passing context");
            done();
        });

        var Logger = bunyan.createLogger({
            name: "a bunyan logger",
            streams: [
                splunkBunyanStream
            ]
        });

        Logger.info("something");
    });
    it("should not retry on Splunk error", function(done) {
        var config = {
            token: "bad-token",
            maxRetries: 5
        };
        var splunkBunyanStream = SplunkBunyan.createStream(config);

        var retryCount = 0;

        // Wrap the _post so we can verify retries
        var post = splunkBunyanStream.stream.logger._post;
        splunkBunyanStream.stream.logger._post = function(requestOptions, callback) {
            retryCount++;
            post(requestOptions, callback);
        };

        splunkBunyanStream.stream.on("error", function(err) {
            assert.ok(err);
            assert.strictEqual(invalidTokenBody.code, err.code);
            assert.strictEqual(invalidTokenBody.text, err.message);
            assert.strictEqual(1, retryCount);
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
    it("should retry on network error", function(done) {
        var config = {
            token: configurationFile.token,
            maxRetries: 5,
            host: "splunk.invalid"
        };
        var splunkBunyanStream = SplunkBunyan.createStream(config);

        var retryCount = 0;

        // Wrap the _post so we can verify retries
        var post = splunkBunyanStream.stream.logger._post;
        splunkBunyanStream.stream.logger._post = function(requestOptions, callback) {
            retryCount++;
            post(requestOptions, callback);
        };

        splunkBunyanStream.stream.on("error", function(err) {
            assert.ok(err);
            assert.strictEqual("ENOTFOUND", err.code);
            assert.strictEqual(config.maxRetries + 1, retryCount);
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
});
