var expect = require('chai').expect;

describe('vaultSecrets', function () {
    describe('should correctly resolve secrets', function () {
        var testrun;

        before(function (done) {
            this.run({
                vaultSecrets: {
                    values: [
                        {
                            key: 'vault:var1',
                            type: 'vault',
                            value: 'https://postman-echo.com',
                            enabled: true,
                            _domains: []
                        },
                        {
                            key: 'vault:var2',
                            type: 'vault',
                            value: 'postman',
                            enabled: true,
                            _domains: ['https://postman-echo.com']
                        },
                        { key: 'vault:var3', type: 'vault', value: 'password', enabled: true }
                    ]
                },
                collection: {
                    item: {
                        name: 'Vault Secrets Test Request',
                        request: {
                            url: '{{vault:var1}}/basic-auth',
                            method: 'GET',
                            auth: {
                                type: 'basic',
                                basic: [
                                    { key: 'username', value: '{{vault:var2}}' },
                                    { key: 'password', value: '{{vault:var3}}' }
                                ]
                            }
                        }
                    }
                }
            }, function (err, results) {
                testrun = results;
                done(err);
            });
        });

        it('should have completed the run', function () {
            expect(testrun).to.be.ok;
            expect(testrun.done.getCall(0).args[0]).to.be.null;
            expect(testrun).to.nested.include({
                'done.calledOnce': true,
                'start.calledOnce': true
            });
        });

        it('should be resolved in request URL', function () {
            var url = testrun.request.getCall(0).args[3].url.toString(),
                response = testrun.response.getCall(0).args[2];

            expect(url).to.equal('https://postman-echo.com/basic-auth');
            expect(response).to.have.property('code', 200);
        });

        it('should be resolved in request auth', function () {
            var request = testrun.response.getCall(0).args[3],
                response = testrun.response.getCall(0).args[2],
                auth = request.auth.parameters().toObject();

            expect(auth).to.deep.include({
                username: 'postman',
                password: 'password'
            });
            expect(response).to.have.property('code', 200);
        });
    });
    describe('should resolve secrets containing domains with protocol', function () {
        var testrun;

        before(function (done) {
            this.run({
                vaultSecrets: {
                    values: [
                        {
                            key: 'vault:var1',
                            type: 'vault',
                            value: 'https://postman-echo.com',
                            enabled: true,
                            _domains: []
                        },
                        {
                            key: 'vault:var2',
                            type: 'vault',
                            value: 'postman',
                            enabled: true,
                            _domains: ['postman-echo.com']
                        },
                        { key: 'vault:var3', type: 'vault', value: 'password', enabled: true }
                    ]
                },
                collection: {
                    item: {
                        name: 'Vault Secrets Test Request',
                        request: {
                            url: 'https://postman-echo.com/basic-auth',
                            method: 'GET',
                            auth: {
                                type: 'basic',
                                basic: [
                                    { key: 'username', value: '{{vault:var2}}' },
                                    { key: 'password', value: '{{vault:var3}}' }
                                ]
                            }
                        }
                    }
                }
            }, function (err, results) {
                testrun = results;
                done(err);
            });
        });

        it('should have completed the run', function () {
            expect(testrun).to.be.ok;
            expect(testrun.done.getCall(0).args[0]).to.be.null;
            expect(testrun).to.nested.include({
                'done.calledOnce': true,
                'start.calledOnce': true
            });
        });

        it('should be resolved in request URL', function () {
            var url = testrun.request.getCall(0).args[3].url.toString(),
                response = testrun.response.getCall(0).args[2];

            expect(url).to.equal('https://postman-echo.com/basic-auth');
            expect(response).to.have.property('code', 200);
        });

        it('should be resolved in request auth', function () {
            var request = testrun.response.getCall(0).args[3],
                response = testrun.response.getCall(0).args[2],
                auth = request.auth.parameters().toObject();

            expect(auth).to.deep.include({
                username: 'postman',
                password: 'password'
            });
            expect(response).to.have.property('code', 200);
        });
    });

    describe('should not resolve secrets with invalid domain', function () {
        var testrun;

        before(function (done) {
            this.run({
                vaultSecrets: {
                    values: [
                        {
                            key: 'vault:var1',
                            type: 'vault',
                            value: 'https://postman-echo.com',
                            enabled: true,
                            _domains: []
                        },
                        {
                            key: 'vault:var2',
                            type: 'vault',
                            value: 'postman',
                            enabled: true,
                            _domains: ['https://postman.com']
                        },
                        { key: 'vault:var3', type: 'vault', value: 'password', enabled: true }
                    ]
                },
                collection: {
                    item: {
                        name: 'Vault Secrets Test Request',
                        request: {
                            url: '{{vault:var1}}/get?var2={{vault:var2}}&var3={{vault:var3}}',
                            method: 'GET'
                        }
                    }
                }
            }, function (err, results) {
                testrun = results;
                done(err);
            });
        });

        it('should have completed the run', function () {
            expect(testrun).to.be.ok;
            expect(testrun.done.getCall(0).args[0]).to.be.null;
            expect(testrun).to.nested.include({
                'done.calledOnce': true,
                'start.calledOnce': true
            });
        });

        it('should only resolve secrets with matching domain in request URL', function () {
            var url = testrun.request.getCall(0).args[3].url.toString(),
                response = testrun.response.getCall(0).args[2];

            expect(url).to.equal('https://postman-echo.com/get?var2=%7B%7Bvault:var2%7D%7D&var3=password');
            expect(response).to.have.property('code', 200);
        });
    });

    describe('should resolve env variable in url and use that for resolving further variables', function () {
        var testrun;

        before(function (done) {
            this.run({
                environment: {
                    values: [
                        {
                            key: 'url',
                            value: 'https://postman-echo.com',
                            enabled: true
                        }
                    ]
                },
                vaultSecrets: {
                    values: [
                        {
                            key: 'vault:var1',
                            type: 'vault',
                            value: 'https://postman-echo.com',
                            enabled: true,
                            _domains: []
                        },
                        {
                            key: 'vault:var2',
                            type: 'vault',
                            value: 'postman',
                            enabled: true,
                            _domains: ['https://postman-echo.com']
                        },
                        { key: 'vault:var3', type: 'vault', value: 'password', enabled: true }
                    ]
                },
                collection: {
                    item: {
                        name: 'Vault Secrets Test Request',
                        request: {
                            url: '{{url}}/basic-auth',
                            method: 'GET',
                            auth: {
                                type: 'basic',
                                basic: [
                                    { key: 'username', value: '{{vault:var2}}' },
                                    { key: 'password', value: '{{vault:var3}}' }
                                ]
                            }
                        }
                    }
                }
            }, function (err, results) {
                testrun = results;
                done(err);
            });
        });

        it('should have completed the run', function () {
            expect(testrun).to.be.ok;
            expect(testrun.done.getCall(0).args[0]).to.be.null;
            expect(testrun).to.nested.include({
                'done.calledOnce': true,
                'start.calledOnce': true
            });
        });

        it('should be resolved in request URL', function () {
            var url = testrun.request.getCall(0).args[3].url.toString(),
                response = testrun.response.getCall(0).args[2];

            expect(url).to.equal('https://postman-echo.com/basic-auth');
            expect(response).to.have.property('code', 200);
        });

        it('should be resolved in request auth', function () {
            var request = testrun.response.getCall(0).args[3],
                response = testrun.response.getCall(0).args[2],
                auth = request.auth.parameters().toObject();

            expect(auth).to.deep.include({
                username: 'postman',
                password: 'password'
            });
            expect(response).to.have.property('code', 200);
        });
    });

    describe('should correctly resolve secrets with * in domains', function () {
        var testrun;

        before(function (done) {
            this.run({
                vaultSecrets: {
                    values: [
                        {
                            key: 'vault:var1',
                            type: 'vault',
                            value: 'https://postman-echo.com',
                            enabled: true,
                            _domains: []
                        },
                        {
                            key: 'vault:var2',
                            type: 'vault',
                            value: 'postman',
                            enabled: true,
                            _domains: ['https://*.postman-echo.com']
                        },
                        { key: 'vault:var3', type: 'vault', value: 'password', enabled: true }
                    ]
                },
                collection: {
                    item: {
                        name: 'Vault Secrets Test Request',
                        request: {
                            url: 'https://www.postman-echo.com/basic-auth',
                            method: 'GET',
                            auth: {
                                type: 'basic',
                                basic: [
                                    { key: 'username', value: '{{vault:var2}}' },
                                    { key: 'password', value: '{{vault:var3}}' }
                                ]
                            }
                        }
                    }
                }
            }, function (err, results) {
                testrun = results;
                done(err);
            });
        });

        it('should have completed the run', function () {
            expect(testrun).to.be.ok;
            expect(testrun.done.getCall(0).args[0]).to.be.null;
            expect(testrun).to.nested.include({
                'done.calledOnce': true,
                'start.calledOnce': true
            });
        });

        it('should be resolved in request URL', function () {
            var url = testrun.request.getCall(0).args[3].url.toString(),
                response = testrun.response.getCall(0).args[2];

            expect(url).to.equal('https://www.postman-echo.com/basic-auth');
            expect(response).to.have.property('code', 200);
        });

        it('should be resolved in request auth', function () {
            var request = testrun.response.getCall(0).args[3],
                response = testrun.response.getCall(0).args[2],
                auth = request.auth.parameters().toObject();

            expect(auth).to.deep.include({
                username: 'postman',
                password: 'password'
            });
            expect(response).to.have.property('code', 200);
        });
    });

    describe('should correctly resolve secrets with variable in non domain matching part of url', function () {
        var testrun;

        before(function (done) {
            this.run({
                vaultSecrets: {
                    values: [
                        {
                            key: 'vault:var1',
                            type: 'vault',
                            value: 'https://postman-echo.com',
                            enabled: true,
                            _domains: []
                        },
                        {
                            key: 'vault:var2',
                            type: 'vault',
                            value: 'postman',
                            enabled: true,
                            _domains: ['https://*.postman-echo.com']
                        },
                        { key: 'vault:var3', type: 'vault', value: 'password', enabled: true },
                        {
                            key: 'vault:pathVar',
                            type: 'vault',
                            value: 'basic-auth',
                            enabled: true,
                            _domains: ['https://*.postman-echo.com']
                        }
                    ]
                },
                collection: {
                    item: {
                        name: 'Vault Secrets Test Request',
                        request: {
                            url: 'https://www.postman-echo.com/{{vault:pathVar}}',
                            method: 'GET',
                            auth: {
                                type: 'basic',
                                basic: [
                                    { key: 'username', value: '{{vault:var2}}' },
                                    { key: 'password', value: '{{vault:var3}}' }
                                ]
                            }
                        }
                    }
                }
            }, function (err, results) {
                testrun = results;
                done(err);
            });
        });

        it('should have completed the run', function () {
            expect(testrun).to.be.ok;
            expect(testrun.done.getCall(0).args[0]).to.be.null;
            expect(testrun).to.nested.include({
                'done.calledOnce': true,
                'start.calledOnce': true
            });
        });

        it('should be resolved in request URL', function () {
            var url = testrun.request.getCall(0).args[3].url.toString(),
                response = testrun.response.getCall(0).args[2];

            expect(url).to.equal('https://www.postman-echo.com/basic-auth');
            expect(response).to.have.property('code', 200);
        });

        it('should be resolved in request auth', function () {
            var request = testrun.response.getCall(0).args[3],
                response = testrun.response.getCall(0).args[2],
                auth = request.auth.parameters().toObject();

            expect(auth).to.deep.include({
                username: 'postman',
                password: 'password'
            });
            expect(response).to.have.property('code', 200);
        });
    });
    describe('should resolve when domains contains multiple elements', function () {
        var testrun;

        before(function (done) {
            this.run({
                vaultSecrets: {
                    values: [
                        {
                            key: 'vault:var1',
                            type: 'vault',
                            value: 'https://postman-echo.com',
                            enabled: true,
                            _domains: []
                        },
                        {
                            key: 'vault:var2',
                            type: 'vault',
                            value: 'postman',
                            enabled: true,
                            _domains: ['https://postman.com', 'https://getpostman.com', 'https://*.postman-echo.com']
                        },
                        { key: 'vault:var3', type: 'vault', value: 'password', enabled: true }
                    ]
                },
                collection: {
                    item: {
                        name: 'Vault Secrets Test Request',
                        request: {
                            url: 'https://postman-echo.com/basic-auth',
                            method: 'GET',
                            auth: {
                                type: 'basic',
                                basic: [
                                    { key: 'username', value: '{{vault:var2}}' },
                                    { key: 'password', value: '{{vault:var3}}' }
                                ]
                            }
                        }
                    }
                }
            }, function (err, results) {
                testrun = results;
                done(err);
            });
        });

        it('should have completed the run', function () {
            expect(testrun).to.be.ok;
            expect(testrun.done.getCall(0).args[0]).to.be.null;
            expect(testrun).to.nested.include({
                'done.calledOnce': true,
                'start.calledOnce': true
            });
        });

        it('should be resolved in request URL', function () {
            var url = testrun.request.getCall(0).args[3].url.toString(),
                response = testrun.response.getCall(0).args[2];

            expect(url).to.equal('https://postman-echo.com/basic-auth');
            expect(response).to.have.property('code', 200);
        });

        it('should be resolved in request auth', function () {
            var request = testrun.response.getCall(0).args[3],
                response = testrun.response.getCall(0).args[2],
                auth = request.auth.parameters().toObject();

            expect(auth).to.deep.include({
                username: 'postman',
                password: 'password'
            });
            expect(response).to.have.property('code', 200);
        });
    });
    describe('should resolve for multiple requests in a collection', function () {
        var testrun;

        before(function (done) {
            this.run({
                vaultSecrets: {
                    values: [
                        {
                            key: 'vault:var1',
                            type: 'vault',
                            value: 'https://postman-echo.com',
                            enabled: true,
                            _domains: []
                        },
                        {
                            key: 'vault:var2',
                            type: 'vault',
                            value: 'postman',
                            enabled: true,
                            _domains: ['https://postman.com', 'https://getpostman.com', 'https://*.postman-echo.com']
                        },
                        { key: 'vault:var3', type: 'vault', value: 'password', enabled: true }
                    ]
                },
                collection: {
                    item: [
                        {
                            name: 'Vault Secrets Test Request',
                            request: {
                                url: 'https://postman-echo.com/basic-auth',
                                method: 'GET',
                                auth: {
                                    type: 'basic',
                                    basic: [
                                        { key: 'username', value: '{{vault:var2}}' },
                                        { key: 'password', value: '{{vault:var3}}' }
                                    ]
                                }
                            }
                        }, {
                            name: 'Vault Secrets Test Request II',
                            request: {
                                url: 'https://postman-echo.com/get?var3={{vault:var3}}',
                                method: 'GET'
                            }
                        }
                    ]
                }
            }, function (err, results) {
                testrun = results;
                done(err);
            });
        });

        it('should have completed the run', function () {
            expect(testrun).to.be.ok;
            expect(testrun.done.getCall(0).args[0]).to.be.null;
            expect(testrun).to.nested.include({
                'done.calledOnce': true,
                'start.calledOnce': true
            });
        });

        it('should be resolved in request URL for first request', function () {
            var url = testrun.request.getCall(0).args[3].url.toString(),
                response = testrun.response.getCall(0).args[2];

            expect(url).to.equal('https://postman-echo.com/basic-auth');
            expect(response).to.have.property('code', 200);
        });

        it('should be resolved in request auth for first request', function () {
            var request = testrun.response.getCall(0).args[3],
                response = testrun.response.getCall(0).args[2],
                auth = request.auth.parameters().toObject();

            expect(auth).to.deep.include({
                username: 'postman',
                password: 'password'
            });
            expect(response).to.have.property('code', 200);
        });

        it('should be resolved in request URL for second request', function () {
            var url = testrun.request.getCall(1).args[3].url.toString(),
                response = testrun.response.getCall(1).args[2];

            expect(url).to.equal('https://postman-echo.com/get?var3=password');
            expect(response).to.have.property('code', 200);
        });
    });
});
