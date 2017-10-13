var assert = chai.assert;

describe("fido comm test", function() {
    it("exists", function() {
        var s = new FidoLocalStorage();
        assert.isObject(s);
    });

    it("opens a database", function() {
        var s = new FidoLocalStorage();
        assert.isNull(s.db);
        return s.init().then(function(res) {
            assert.instanceOf(res, IDBDatabase);
            assert.instanceOf(s.db, IDBDatabase);
            assert.strictEqual(res, s.db);
            return res;
        });
    });

    it("opens a database twice", function() {
        var s = new FidoLocalStorage();
        assert.isNull(s.db);
        var res1;
        return s.init()
            .then(function(res) {
                res1 = res;
                return s.init();
            })
            .then(function(res2) {
                assert.strictEqual(res1, res2);
            });
    });

    it("throws if trying to save before init", function() {
        var s = new FidoLocalStorage();
        assert.throws(function() {
            s.saveCredential(new ArrayBuffer());
        }, Error);
    });

    it.skip("throws when trying to save non-id", function() {
        var s = new FidoLocalStorage();
        var p = s.init();
        assert.throws(function() {
            p.then(() => {
                s.saveCredential("blah");
            });
        }, TypeError);
        return p;
    });

    // XXX the tests that follow are order dependent
    it("saves a credential", function() {
        var s = new FidoLocalStorage();
        return s.init()
            .then(() => {
                return s.saveCredential(testCredId);
            });
    });

    it("throws if trying to get before init", function() {
        var s = new FidoLocalStorage();
        assert.throws(function() {
            s.getCredentials();
        }, Error);
    });

    it("finds all credentials", function() {
        var s = new FidoLocalStorage();
        s.init()
            .then(() => {
                console.log ("getting credentials");
                return s.getCredentials();
            })
            .then((credList) => {
                console.log ("got creds:", credList);
                assert.isArray (credList);
            });
    });

    it("finds multiple credentials");

    it.only("deletes a database", function() {
        var s = new FidoLocalStorage();
        return s.deleteAll()
            .then(() => {
                return s.init();
            })
            .then(() => {
                return s.getCredentials();
            })
            .then((credList) => {
                assert.isArray(credList);
                assert.strictEqual(credList.length, 0);
            });
    });
});

describe("fido server test", function() {
    it("gets a registration challenge");
    it("validates an registration response");
    it("gets a authn challenge");
    it("validates an authn response");
});

describe("webauthn wrapper", function() {
    it("exists", function() {
        var authn = new WebAuthnTransaction();
        assert.isObject (authn);
    });

    it("does registration", function() {
        var authn = new WebAuthnTransaction();
        return authn.register();
    });

    it("returns default registration options");

    it("does authentication", function() {
        var authn = new WebAuthnTransaction();
        return authn.register()
            .then(() => {
                return authn.authenticate();
            });
    });

    it("returns default authn options");
});

/* JSHINT */
/* globals chai, FidoLocalStorage, FidoServerComm, WebAuthnTransaction, IDBDatabase, testCredId */




