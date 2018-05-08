import { expect } from 'chai';
import * as sinon from 'sinon';
import * as restify from 'restify';
import { App } from '../../src/App';

let sandbox: sinon.SinonSandbox;
const server: any = {use: Function, get: Function, on: Function, listen: Function};
const req: any = {method: 'GET', url: '/foo'};
const res: any = {send: Function, statusCode: 200};

// tslint:disable:no-unused-expression chai-vague-errors
describe('App', () => {
    before(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        delete req._start;
        sandbox.restore();
    });

    describe('constructor()', () => {
        describe('initServer()', () => {
            it('should init a restify server, add a middleware to log requests and one default route', () => {
                const clock = sandbox.useFakeTimers(Date.now());
                const createServerStub = sandbox.stub(restify, 'createServer').returns(server);
                const logSpy = sandbox.spy(console, 'log');
                const next: any = sandbox.stub();
                const useStub = sandbox.stub(server, 'use').callsFake((cb: Function) => {
                    cb(req, null, next);
                });
                const sendStub = sandbox.stub(res, 'send');
                const getStub = sandbox.stub(server, 'get').callsFake((url: string, cb: Function) => {
                    cb(null, res, next);
                });
                const onStub = sandbox.stub(server, 'on').callsFake((event: string, cb: Function) => {
                    clock.tick(5);
                    cb(req, res, next);
                });

                new App();
                expect(createServerStub.calledOnceWithExactly()).to.be.true;
                expect(useStub.calledOnce).to.be.true;
                expect(getStub.calledOnce).to.be.true;
                expect(onStub.calledOnce).to.be.true;
                expect(logSpy.calledOnceWithExactly(`${req.method} ${req.url} - ${res.statusCode} - 5ms`)).to.be.true;
                expect(sendStub.calledOnceWithExactly('Hello world !')).to.be.true;
                expect(next.calledTwice).to.be.true;
            });

            it('should log a duration of 0ms if req._start is not set', () => {
                const clock = sandbox.useFakeTimers(Date.now());
                const createServerStub = sandbox.stub(restify, 'createServer').returns(server);
                const logSpy = sandbox.spy(console, 'log');
                sandbox.stub(server, 'use');
                sandbox.stub(server, 'get');
                const onStub = sandbox.stub(server, 'on').callsFake((event: string, cb: Function) => {
                    clock.tick(5);
                    cb(req, res, null);
                });

                new App();
                expect(createServerStub.calledOnceWithExactly()).to.be.true;
                expect(onStub.calledOnce).to.be.true;
                expect(logSpy.calledOnceWithExactly(`${req.method} ${req.url} - ${res.statusCode} - 0ms`)).to.be.true;
            });
        });
    });

    describe('start()', () => {
        it('should start its internal restify server on the given port, and log a message when done', () => {
            sandbox.stub(restify, 'createServer').returns(server);
            sandbox.stub(server, 'use');
            sandbox.stub(server, 'get');
            sandbox.stub(server, 'on');
            const listenStub = sandbox.stub(server, 'listen').callsFake((port: number, cb: Function) => {
                cb();
            });
            const logSpy = sandbox.spy(console, 'log');

            const app = new App();
            app.start(8080);
            expect(listenStub.calledOnceWith(8080)).to.be.true;
            expect(logSpy.calledOnceWithExactly('Server started on port 8080')).to.be.true;
        });
    });
});
