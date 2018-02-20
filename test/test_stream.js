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

var splunkBunyan = require("../index");
var assert = require("assert");
var request = require("request");

/** Integration Tests **/

var TOKEN;

var successBody = {
    text: "Success",
    code: 0
};

var invalidTokenBody = {
    text: "Invalid token",
    code: 4
};

var ____consoleLog = console.log;
function mute() {
    console.log = function(){};
}
function unmute() {
    console.log = ____consoleLog;
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

describe("Setup Splunk on localhost:8089 HEC", function() {
    it("should be enabled", function(done) {
        request.post("https://admin:changeme@localhost:8089/servicesNS/admin/splunk_httpinput/data/inputs/http/http/enable?output_mode=json", {strictSSL: false}, function(err) {
            assert.ok(!err);
            done();
        });
    });
    it("should create a token in test/config.json", function(done) {
        request.post("https://admin:changeme@localhost:8089/servicesNS/admin/splunk_httpinput/data/inputs/http?output_mode=json", {strictSSL: false, body: "name=splunk_logging" + Date.now()}, function(err, resp, body) {
            assert.ok(!err);
            var tokenStart = body.indexOf("\"token\":\"");
            var tokenEnd = tokenStart + 36; // 36 = guid length
            var token = body.substring(tokenStart + 9, tokenEnd + 9); // 9 = prefix length of \"token\":\"
            assert.strictEqual(token.length, 36);
            TOKEN = token;
            done();
        });
    });
    it("should have the env variable set", function() {
        assert.ok(TOKEN);
        assert.strictEqual(TOKEN.length, 36);
    });
});

describe("SplunkStream", function() {

    it("should write a string", function(done) {
        var config = {
            token: TOKEN,        };

        var splunkBunyanStream = splunkBunyan.createStream(config);

        assert.ok(splunkBunyanStream);
        assert.strictEqual("info", splunkBunyanStream.level);
        assert.strictEqual("raw", splunkBunyanStream.type);
        assert.strictEqual(config.token, splunkBunyanStream.stream.config().token);
        assert.strictEqual("splunk-bunyan-logger/0.9.3", splunkBunyanStream.stream.config().name);
        assert.strictEqual("localhost", splunkBunyanStream.stream.config().host);
        assert.strictEqual("https", splunkBunyanStream.stream.config().protocol);
        assert.strictEqual("info", splunkBunyanStream.stream.config().level);
        assert.strictEqual(8088, splunkBunyanStream.stream.config().port);
        assert.strictEqual(0, splunkBunyanStream.stream.config().maxRetries);
        assert.strictEqual(1, splunkBunyanStream.stream.config().maxBatchCount);
        assert.strictEqual(0, splunkBunyanStream.stream.config().maxBatchSize);

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
    it("should error when writing a string with bad token", function(done) {
        var config = {
            token: "bad-token",
            maxBatchCount: 1
        };

        var splunkBunyanStream = splunkBunyan.createStream(config);

        assert.ok(splunkBunyanStream);
        assert.strictEqual("info", splunkBunyanStream.level);
        assert.strictEqual("raw", splunkBunyanStream.type);
        assert.strictEqual(config.token, splunkBunyanStream.stream.config().token);
        assert.strictEqual("splunk-bunyan-logger/0.9.3", splunkBunyanStream.stream.config().name);
        assert.strictEqual("localhost", splunkBunyanStream.stream.config().host);
        assert.strictEqual("https", splunkBunyanStream.stream.config().protocol);
        assert.strictEqual("info", splunkBunyanStream.stream.config().level);
        assert.strictEqual(8088, splunkBunyanStream.stream.config().port);

        var run = false;

        splunkBunyanStream.on("error", function(err, errContext) {
            run = true;
            assert.ok(err);
            assert.strictEqual(err.message, invalidTokenBody.text);
            assert.strictEqual(err.code, invalidTokenBody.code);
            assert.ok(errContext);

            var body = JSON.parse(errContext.message).event;
            assert.strictEqual(body.message.msg, "something");
            assert.strictEqual(body.severity, "info");
        });

        var sendCallback = splunkBunyanStream.stream.send;
        splunkBunyanStream.stream.send = function(err, resp, body) {
            assert.ok(!err);
            assert.ok(run);
            assert.strictEqual(body.text, invalidTokenBody.text);
            assert.strictEqual(body.code, invalidTokenBody.code);
            sendCallback(err, resp, body);
            unmute();
            done();
        };

        var data = "something";

        mute();
        splunkBunyanStream.stream.write(formatForBunyan(data));
    });
    it("should emit error when writing without args", function(done) {
        var config = {
            token: TOKEN,
            maxBatchCount: 1
        };
        var splunkBunyanStream = splunkBunyan.createStream(config);

        splunkBunyanStream.stream.on("error", function(err) {
            assert.ok(err);
            assert.strictEqual(err.message, "Must pass a parameter to write.");
            done();
        });
        splunkBunyanStream.stream.write();
    });
    it("should not retry on Splunk error", function(done) {
        var config = {
            token: "bad-token",
            maxRetries: 5,
            maxBatchCount: 1
        };
        var splunkBunyanStream = splunkBunyan.createStream(config);

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
            unmute();
            done();
        });

        mute();
        splunkBunyanStream.stream.write("something");
    });
    it("should retry on network error, bad host", function(done) {
        this.timeout(3 * 1000);
        var config = {
            token: TOKEN,
            maxRetries: 3,
            host: "splunk.invalid",
            maxBatchCount: 1
        };
        var splunkBunyanStream = splunkBunyan.createStream(config);

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
            unmute();
            done();
        });

        mute();
        splunkBunyanStream.stream.write("something");
    });
    it("should retry on network error, wrong port", function(done) {
        this.timeout(3 * 1000);
        var config = {
            token: TOKEN,
            maxRetries: 3,
            port: 1075,
            maxBatchCount: 1
        };
        var splunkBunyanStream = splunkBunyan.createStream(config);

        var retryCount = 0;

        // Wrap the _post so we can verify retries
        var post = splunkBunyanStream.stream.logger._post;
        splunkBunyanStream.stream.logger._post = function(requestOptions, callback) {
            retryCount++;
            post(requestOptions, callback);
        };

        splunkBunyanStream.stream.on("error", function(err) {
            assert.ok(err);
            assert.strictEqual("ECONNREFUSED", err.code);
            assert.strictEqual(config.maxRetries + 1, retryCount);
            unmute();
            done();
        });

        mute();
        splunkBunyanStream.stream.write("something");
    });
    // TODO: add some tests for batching (interval, size, count)
});