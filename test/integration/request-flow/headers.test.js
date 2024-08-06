var sinon = require('sinon'),
    expect = require('chai').expect,
    fs = require('fs'),
    Header = require('postman-collection').Header,
    cookieJar = require('postman-request').jar();

(typeof window === 'undefined' ? describe : describe.skip)('request headers', function () {
    var testrun,
        HEADERS_URL,
        COOKIES_URL;

    before(function (done) {
        HEADERS_URL = global.servers.http + '/headers';
        COOKIES_URL = global.servers.http + '/cookies';

        // add 🍪s in the jar
        cookieJar.setCookieSync('c3=v3; path=/cookies', COOKIES_URL);
        cookieJar.setCookieSync('c4=v4; path=/cookies', COOKIES_URL);

        this.run({
            requester: {
                cookieJar
            },
            fileResolver: fs,
            collection: {
                item: [{
                    name: 'Duplicate headers',
                    request: {
                        url: HEADERS_URL,
                        header: [{
                            key: 'Header-Name',
                            value: 'value1'
                        }, {
                            key: 'Header-Name',
                            value: 'value2'
                        }]
                    }
                }, {
                    name: 'Disabled & Falsy headers',
                    request: {
                        url: HEADERS_URL,
                        header: [{
                            key: 'Header-Name-1',
                            value: 'value1'
                        }, {
                            key: 'Header-Name-2',
                            value: 'value2',
                            disabled: true
                        }, {
                            key: '',
                            value: 'value3'
                        }]
                    }
                }, {
                    name: 'Case Insensitive',
                    request: {
                        url: HEADERS_URL,
                        header: [{
                            key: 'Header-Name-0',
                            value: 'value0'
                        }, {
                            key: 'Header-Name-1',
                            value: 'value1'
                        }, {
                            key: 'header-name-1',
                            value: 'value2'
                        }, {
                            key: 'HEADER-NAME-2',
                            value: 'value3'
                        }]
                    }
                }, {
                    name: 'System headers',
                    request: {
                        url: HEADERS_URL,
                        header: [{
                            key: 'Header-Name-0',
                            value: 'value0'
                        }, {
                            key: 'accept-encoding',
                            value: 'disabled-system-header',
                            disabled: true
                        }, {
                            key: 'User-Agent',
                            value: 'PostmanRuntime/test'
                        }, {
                            key: 'Postman-Token',
                            value: 'someCustomToken'
                        }, {
                            key: 'referer',
                            value: HEADERS_URL
                        }]
                    }
                }, {
                    name: 'Cookie headers',
                    request: {
                        url: COOKIES_URL,
                        header: [{
                            key: 'Cookie',
                            value: 'c1=v1'
                        }, {
                            key: 'Cookie',
                            value: 'c2=v2'
                        }]
                    }
                }, {
                    name: 'content-length',
                    request: {
                        url: 'https://postman-echo.com/post',
                        method: 'POST',
                        body: {
                            mode: 'formdata',
                            formdata: [{
                                key: 'file',
                                src: 'test/fixtures/upload-file.json',
                                type: 'file'
                            }]
                        }
                    }
                }, {
                    name: 'http2',
                    request: {
                        url: 'https://postman-echo.com/get',
                        method: 'GET'
                    },
                    protocolProfileBehavior: {
                        protocolVersion: 'http2'
                    }
                },
                {
                    name: 'auto',
                    request: {
                        url: 'https://postman-echo.com/get',
                        method: 'GET'
                    },
                    protocolProfileBehavior: {
                        protocolVersion: 'auto'
                    }
                }]
            }
        }, function (err, results) {
            testrun = results;
            done(err);
        });
    });

    it('should complete the run', function () {
        expect(testrun).to.be.ok;
        sinon.assert.calledOnce(testrun.start);
        sinon.assert.calledOnce(testrun.done);
        sinon.assert.calledWith(testrun.done.getCall(0), null);

        sinon.assert.callCount(testrun.request, 8);
        sinon.assert.callCount(testrun.response, 8);
    });

    it('should handle duplicate headers correctly', function () {
        sinon.assert.calledWith(testrun.request.getCall(0), null);
        sinon.assert.calledWith(testrun.response.getCall(0), null);

        var response = testrun.response.getCall(0).args[2],
            requestHeaders = JSON.parse(response.stream);

        expect(requestHeaders).to.deep.include.members([
            { key: 'Header-Name', value: 'value1' },
            { key: 'Header-Name', value: 'value2' }
        ]);
    });

    it('should handle disabled and falsy header keys correctly', function () {
        sinon.assert.calledWith(testrun.request.getCall(1), null);
        sinon.assert.calledWith(testrun.response.getCall(1), null);

        var response = testrun.response.getCall(1).args[2],
            requestHeaders = JSON.parse(response.stream),
            headerKeys = requestHeaders.map(function (header) { return header.key; });

        expect(requestHeaders).to.deep.include({
            key: 'Header-Name-1',
            value: 'value1'
        });

        expect(headerKeys).to.not.include('Header-Name-2');
        expect(headerKeys).to.not.include('');
    });

    it('should handle headers with different cases correctly', function () {
        sinon.assert.calledWith(testrun.request.getCall(2), null);
        sinon.assert.calledWith(testrun.response.getCall(2), null);

        var response = testrun.response.getCall(2).args[2],
            requestHeaders = JSON.parse(response.stream);

        expect(requestHeaders).to.deep.include.members([
            { key: 'Header-Name-0', value: 'value0' },
            { key: 'header-name-1', value: 'value2' },
            { key: 'HEADER-NAME-2', value: 'value3' }
        ]);

        // @todo: handle multiple headers with different capitalization
        // https://github.com/postmanlabs/postman-app-support/issues/5372
        expect(requestHeaders).to.not.deep.include({
            key: 'Header-Name-1',
            value: 'value1'
        });
    });

    it('should handle system headers correctly', function () {
        sinon.assert.calledWith(testrun.request.getCall(3), null);
        sinon.assert.calledWith(testrun.response.getCall(3), null);

        var request = testrun.response.getCall(3).args[3],
            response = testrun.response.getCall(3).args[2],
            requestHeaders = JSON.parse(response.stream);

        // @note this will fail on updating system headers to track those changes
        expect(requestHeaders).to.have.deep.members([
            { key: 'Header-Name-0', value: 'value0' },
            { key: 'User-Agent', value: 'PostmanRuntime/test' },
            { key: 'Postman-Token', value: 'someCustomToken' },
            { key: 'referer', value: HEADERS_URL },
            { key: 'Accept', value: '*/*' },
            { key: 'Cache-Control', value: 'no-cache' },
            { key: 'Host', value: HEADERS_URL.split('/')[2] },
            { key: 'Accept-Encoding', value: 'gzip, deflate, br' },
            { key: 'Connection', value: 'keep-alive' }
        ]);

        // system headers should be added correctly
        // @note currently, only `Connection` header is added by NodeJS which
        // is handled by the requester. This test will fail if any other
        // header will be added by NodeJS.
        expect(request.headers.members).to.have.deep.members([
            // user-defined headers
            new Header({ key: 'Header-Name-0', value: 'value0' }),
            // user-defined, not overwritten by system
            new Header({ key: 'User-Agent', value: 'PostmanRuntime/test' }),
            new Header({ key: 'Postman-Token', value: 'someCustomToken' }),
            // requester header(overwritten) not added as system if value is unchanged
            new Header({ key: 'referer', value: HEADERS_URL }),
            // user-defined, disabled header same as one-of system header
            new Header({ key: 'accept-encoding', value: 'disabled-system-header', disabled: true }),
            // system headers
            new Header({ key: 'Accept', value: '*/*', system: true }),
            new Header({ key: 'Cache-Control', value: 'no-cache', system: true }),
            new Header({ key: 'Host', value: HEADERS_URL.split('/')[2], system: true }),
            new Header({ key: 'Accept-Encoding', value: 'gzip, deflate, br', system: true }),
            new Header({ key: 'Connection', value: 'keep-alive', system: true })
        ]);
    });

    it('should handle multiple cookie headers correctly', function () {
        sinon.assert.calledWith(testrun.request.getCall(4), null);
        sinon.assert.calledWith(testrun.response.getCall(4), null);

        var request = testrun.response.getCall(4).args[3],
            response = testrun.response.getCall(4).args[2],
            requestHeaders = JSON.parse(response.stream);

        // make sure there's only 1 cookie header
        expect(requestHeaders.filter(function (h) { return h.key.toLowerCase() === 'cookie'; }))
            .to.have.lengthOf(1);
        expect(requestHeaders).to.deep.include.members([
            { key: 'Cookie', value: 'c1=v1; c2=v2; c3=v3; c4=v4' }
        ]);

        // make sure duplicates (multiple cookie headers) are removed
        expect(request.headers.reference.cookie)
            .to.deep.eql(new Header({ key: 'Cookie', value: 'c1=v1; c2=v2; c3=v3; c4=v4', system: true }));
    });

    it('should handle content-length header correctly', function () {
        sinon.assert.calledWith(testrun.request.getCall(5), null);
        sinon.assert.calledWith(testrun.response.getCall(5), null);

        var request = testrun.response.getCall(5).args[3],
            response = testrun.response.getCall(5).args[2],
            requestHeaders = JSON.parse(response.stream).headers;

        expect(requestHeaders).to.have.property('content-length', '253');

        expect(request.headers.members[request.headers.count() - 1])
            .to.deep.equal(new Header({ key: 'Content-Length', system: true, value: '253' }));
    });

    it('should have all request headers in http2 in debug data', function () {
        sinon.assert.calledWith(testrun.request.getCall(6), null);
        sinon.assert.calledWith(testrun.response.getCall(6), null);

        var history = testrun.response.getCall(6).lastArg,
            executionData = history.execution.data[0],
            requestHeaders = executionData.request.headers;

        const headersToCheck = new Set(['accept', 'cache-control', 'accept-encoding',
            'cookie', 'postman-token', ':path', ':method', ':authority', ':scheme', 'user-agent']);

        expect(executionData.response.httpVersion).to.eql('2.0');

        requestHeaders.forEach(({ key }) => {
            expect(headersToCheck.has(key.toLowerCase())).to.eql(true, `Header ${key} not found`);
        });
    });

    it('should have all request headers in http2 in debug auto', function () {
        sinon.assert.calledWith(testrun.request.getCall(7), null);
        sinon.assert.calledWith(testrun.response.getCall(7), null);

        var history = testrun.response.getCall(7).lastArg,
            executionData = history.execution.data[0],
            requestHeaders = executionData.request.headers;


        const headersToCheck = new Set(['accept', 'cache-control', 'accept-encoding',
            'cookie', 'postman-token', ':path', ':method', ':authority', ':scheme', 'user-agent']);

        expect(executionData.response.httpVersion).to.eql('2.0');

        requestHeaders.forEach(({ key }) => {
            expect(headersToCheck.has(key.toLowerCase())).to.eql(true, `Header ${key} not found`);
        });
    });
});
