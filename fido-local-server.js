/**
 * WebAuthn / FIDO2 Relying Party Application
 *
 * Facilitates communication between WebAuthn APIs and a FIDO server.
 * The current implementation uses a "local server" rather than some sort of REST-based
 * server for simplicity. In reality, this would be replaced with communications to a
 * back-end webserver or authn server.
 *
 * Developed by Adam Powers, FIDO Alliance
 */

function _buf2hex(buffer) { // buffer is an ArrayBuffer
    return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

function _hex2buf(hex) {
    if (typeof hex !== 'string') {
        throw new TypeError('Expected input to be a string')
    }

    if ((hex.length % 2) !== 0) {
        throw new RangeError('Expected string to be an even number of characters')
    }

    var view = new Uint8Array(hex.length / 2)

    for (var i = 0; i < hex.length; i += 2) {
        view[i / 2] = parseInt(hex.substring(i, i + 2), 16)
    }

    return view.buffer
}

/**
 * Stores and retreives credentials using indexeddb
 */
class FidoLocalStorage {
    constructor() {
        this.dbName = "fidoLocalServerDb";
        this.dbTableName = "creds";
        this.db = null;
        this.name = "bob";
    }

    init() {
        return new Promise((resolve, reject) => {
            // if we already have the database open, just resolve it
            if (this.db) {
                // console.log("Database already exists, returning");
                return resolve(this.db);
            }

            var request = window.indexedDB.open(this.dbName);

            request.onupgradeneeded = () => {
                console.log("Creating database...");
                var db = request.result;
                db.createObjectStore(this.dbTableName, {
                    keyPath: "id"
                });
            };

            request.onsuccess = () => {
                console.log("Database created!");
                this.db = request.result;
                return resolve(this.db);
            };

            request.onerror = () => {
                return reject(new Error("Couldn't initialize DB"));
            };
        });
    }

    saveCredential(idBuffer) {
        if (!this.db) {
            throw new Error("not initialized");
        }

        if (!(idBuffer instanceof ArrayBuffer) || idBuffer.length < 1) {
            throw new TypeError("expected idBuffer argument to be ArrayBuffer");
        }

        return new Promise((resolve, reject) => {
            var db = this.db;
            console.log ("db", db);
            var tx = db.transaction(this.dbTableName, "readwrite");
            var store = tx.objectStore(this.dbTableName);

            // TODO: create credential ID here

            var newCred = {
                id: _buf2hex(idBuffer)
            };

            store.put(newCred);

            tx.oncomplete = function() {
                return resolve(true);
            };

            tx.onerror = function(e) {
                return reject(new Error("Couldn't create credential" + e));
            };
        });

    }

    getCredentials() {
        if (!this.db) {
            throw new Error("not initialized");
        }

        return new Promise((resolve, reject) => {
            var tx = this.db.transaction(this.dbTableName, "readonly");
            var store = tx.objectStore(this.dbTableName);

            var request = store.getAll();
            request.onsuccess = function() {
                var matching = request.result;
                if (matching !== undefined) {

                    matching.id = matching.idBuf; // convert credential.id back to an ArrayBuffer
                    return resolve(matching);
                } else {
                    return reject(new Error("Couldn't get credential list"));
                }
            };
        });
    }

    deleteAll() {
        return new Promise((resolve, reject) => {
            if (this.dbName === undefined) {
                throw new Error("Trying to delete undefined database");
            }

            var deleteRequest = window.indexedDB.deleteDatabase(this.dbName);

            deleteRequest.onerror = (e) => {
                console.log("Error deleting database");
                return reject(new Error("Error deleting database" + e));
            };

            deleteRequest.onsuccess = () => {
                console.log("Database successfully deleted:", this.dbName);
                return resolve();
            };
        });
    }
}

/**
 * Class for communicating to a FIDO server. Currently a "local" server.
 */
class FidoServerComm {
    constructor() {
        // should get the host:port of the server to be used as the Relying Party ID
        this.rpId = window.location.origin.replace(/^http(s)?:\/\//, "");
        this.storage = new FidoLocalStorage();
    }

    init() {
        return this.storage.init();
    }

    /**
     * Get random bytes that represent a challenge
     * @return {Promise<Object>} Promise that resolves to an object containing the `challenge` as an ArrayBuffer and the `rpId` as a String.
     */
    getRegisterChallenge() {
        var challengeBytes = new Uint8Array(16);
        window.crypto.getRandomValues(challengeBytes);

        this.regChallenge = challengeBytes;

        return Promise.resolve({
            challenge: challengeBytes,
            rpId: this.rpId
        });
    }

    sendRegisterResponse(resp) {
        var rawId = resp.rawId;
        if (typeof rawId === "object" &&
            rawId.buffer instanceof ArrayBuffer)
            rawId = rawId.buffer;

        if (!(rawId instanceof ArrayBuffer)) {
            throw new TypeError("expected resp argument to have rawId value of type ArrayBuffer");
        }

        // XXX TODO: validate response

        // cleanup
        this.regChallenge = null;

        // store credential
        return this.storage.saveCredential (rawId);
    }

    /**
     * Get random bytes that represent a challenge
     * @return {Promise<Object>} Promise that resolves to an object containing the `challenge` as an ArrayBuffer and the `rpId` as a String.
     */
    getAuthnChallenge() {
        var challengeBytes = new Uint8Array(16);
        window.crypto.getRandomValues(challengeBytes);

        this.authnChallenge = challengeBytes;

        return this.storage.getCredentials()
            .then((credList) => {
                return {
                    challenge: challengeBytes,
                    rpId: this.rpId,
                    credList: credList
                };
            });
    }

    sendAuthnResponse(resp) {
        console.log ("authn response", resp);

        // XXX TODO: validate response

        // cleanup
        this.authnChallenge = null;
    }
}

class WebAuthnTransaction {
    constructor() {

    }

    register() {
        var server = new FidoServerComm();

        // connect to server
        return server.init()
            .then(() => {
                // get challenge
                return server.getRegisterChallenge();
            })
            .then((challenge) => {
                // console.log("challenge", challenge);

                // create credentials
                var options = this.getDefaultRegisterOptions(challenge);
                // console.log("options:", options);
                return navigator.credentials.create(options);
            })
            .then((newCred) => {
                // console.log("new cred", newCred);

                // send credentials back to server
                return server.sendRegisterResponse(newCred);
            });
    }

    getDefaultRegisterOptions(challenge) {
        var ret = {
            publicKey: {
                challenge: challenge.challenge,
                // Relying Party:
                rp: {
                    name: "Acme",
                    id: challenge.rpId
                },

                // User:
                user: {
                    id: "1098237235409872",
                    name: "john.p.smith@example.com",
                    displayName: "John P. Smith",
                    icon: "https://pics.acme.com/00/p/aBjjjpqPb.png"
                },

                parameters: [{
                    type: "public-key",
                    algorithm: "ES256",
                    // algorithm: -7,
                }],

                timeout: 60000, // 1 minute
                excludeList: [] // No excludeList
            }
        };

        return ret;
    }

    authenticate() {
        var server = new FidoServerComm();

        // connect to server
        return server.init()
            .then(() => {
                // get challenge
                return server.getAuthnChallenge();
            })
            .then((challenge) => {
                console.log("challenge", challenge);
                var options = this.getDefaultAuthnOptions(challenge);
                console.log("options:", options);

                // create assertion
                return navigator.credentials.get(options);
            })
            .then((assertion) => {
                console.log("new cred", assertion);

                // send credentials back to server
                return server.sendAuthnResponse(assertion);
            });
    }

    getDefaultAuthnOptions(challenge) {
        console.log("challenge.credList[0].id:", challenge.credList[0].id);
        console.log("allow list", _hex2buf(challenge.credList[0].id));
        var rawId = new Uint8Array(_hex2buf(challenge.credList[0].id));
        console.log("rawId", rawId);
        // var cred = {
        //     type: "public-key",
        //     // id: Uint8Array.from(rawId),
        //     id: rawId,
        //     transports: ["usb", "nfc", "ble"],
        // };
        var credList = challenge.credList.map(function(val, idx) {
            console.log (`${idx}:`, val);
            return {
                type: "public-key",
                // id: Uint8Array.from(rawId),
                id: new Uint8Array(_hex2buf(val.id)),
                transports: ["usb", "nfc", "ble"],
            };
        });
        console.log ("credList", credList);

        var ret = {
            publicKey: {
                // rpId: challenge.rpId,
                rpId: challenge.rpId,
                challenge: challenge.challenge,
                timeout: 60000,
                allowList: credList
            }
        };

        return ret;
    }
}

/* JSHINT */
/* exported FidoLocalStorage, FidoServerComm, WebAuthnTransaction */