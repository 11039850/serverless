'use strict';

const fs = require('fs');

const sinon = require('sinon');
const google = require('googleapis');

const GoogleProvider = require('./googleProvider');
const Serverless = require('../test/serverless');

describe('GoogleProvider', () => {
  let readFileSyncStub;
  let googleProvider;
  let serverless;
  let setProviderStub;

  beforeEach(() => {
    serverless = new Serverless();
    serverless.service = {
      provider: {
        project: 'example-project',
        credentials: '12345678-abcdefgh',
      },
    };
    setProviderStub = sinon.stub(serverless, 'setProvider').returns();
    readFileSyncStub = sinon.stub(fs, 'readFileSync')
      .returns('{"client_email": "foo@bar.de","private_key": "wasdqwerty"}');
    googleProvider = new GoogleProvider(serverless);
  });

  afterEach(() => {
    serverless.setProvider.restore();
    fs.readFileSync.restore();
  });

  describe('#getProviderName()', () => {
    it('should return the provider name', () => {
      expect(GoogleProvider.getProviderName()).toEqual('google');
    });
  });

  describe('#constructor()', () => {
    it('should store an instance of serverless', () => {
      expect(googleProvider.serverless).toBeInstanceOf(Serverless);
    });

    it('should store an instance of itself', () => {
      expect(googleProvider.provider).toBeInstanceOf(GoogleProvider);
    });

    it('should set the provider with the Serverless instance', () => {
      expect(setProviderStub.calledOnce).toEqual(true);
    });

    it('should set the used SDKs', () => {
      expect(googleProvider.sdk.deploymentmanager)
        .toBeDefined();

      expect(googleProvider.sdk.storage)
        .toBeDefined();
    });
  });

  xdescribe('#request()', () => {
    let getAuthClientStub;
    let isServiceSupportedStub;
    let callStub;

    beforeEach(() => {
      /*
      getAuthClientStub = sinon.stub(googleProvider, 'getAuthClient').returns({
        authorize: sinon.stub().withArgs().returns(),
      });
      isServiceSupportedStub = sinon.stub(googleProvider, 'isServiceSupported').returns(true);
      */

      googleProvider.sdk = {
        someService: {
          someNamespace: {
            someMethod: () => {},
          },
        },
      };

      //callStub = sinon.stub(googleProvider.sdk.someService.someNamespace, 'someMethod').returns(true);
    });

    it('should merge params', () => {
      const params = {
        foo: 'bar',
      };

      return googleProvider.request('someService', 'someNamespace', 'someMethod').then((done) => {
        //expect(getAuthClientStub.calledOne).toEqual(true);
        //expect(isServiceSupportedStub.calledOnce).toEqual(true);
        //expect(callStub.calledOnce).toEqual(true);
        done();
      });
    });

    afterEach(() => {
      getAuthClientStub.restore();
      isServiceSupportedStub.restore();
      callStub.restore();
    });
  });

  describe('#getAuthClient()', () => {
    it('should return a new authClient', () => {
      const authClient = googleProvider.getAuthClient();

      expect(readFileSyncStub.calledOnce).toEqual(true);
      expect(authClient).toBeInstanceOf(google.auth.JWT);
    });
  });

  describe('#isServiceSupported()', () => {
    const sdk = {
      serviceOne: '',
      serviceTwo: '',
    };

    it('should do nothing if service is available', () => {
      expect(() => {
        googleProvider.isServiceSupported(sdk, 'serviceOne');
      }).not.toThrow(Error);
    });

    it('should throw error if service is not Supported', () => {
      expect(() => {
        googleProvider.isServiceSupported(sdk, 'unsupported');
      }).toThrow(Error);
    });
  });
});
