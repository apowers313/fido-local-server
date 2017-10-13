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

// IIFE for clean namespace
function _buf2hex(buffer) { // buffer is an ArrayBuffer
    return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
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
                console.log("Database already exists, returning");
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
            console.log("Saving credential");
            var db = this.db;
            var tx = db.transaction(this.dbTableName, "readwrite");
            var store = tx.objectStore(this.dbTableName);

            // TODO: create credential ID here

            var newCred = {
                id: _buf2hex(idBuffer)
            };

            console.log ("idBuffer", idBuffer);
            console.log("New Credential:", newCred);
            store.put(newCred);

            tx.oncomplete = function() {
                return resolve(true);
            };

            tx.onerror = function(e) {
                console.log("ERROR");
                console.log(e);
                return reject(new Error("Couldn't create credential"));
            };
        });

    }

    getCredentials() {
        if (!this.db) {
            throw new Error("not initialized");
        }

        return new Promise ((resolve, reject) => {
            var tx = this.db.transaction(this.dbTableName, "readonly");
            var store = tx.objectStore(this.dbTableName);
            // var index = store.index("by_rpId", "rpId", {
            //     unique: false
            // });

            // var rpId = _buf2hex(rpIdHash);
            var request = store.getAll();
            request.onsuccess = function() {
                var matching = request.result;
                if (matching !== undefined) {

                    matching.id = matching.idBuf; // convert credential.id back to an ArrayBuffer
                    return resolve(matching);
                } else {
                    console.log("Couldn't get credential list");
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
        console.log("RP ID:", this.rpId);
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
        // cleanup
        this.regChallenge = null;
    }

    /**
     * Get random bytes that represent a challenge
     * @return {Promise<Object>} Promise that resolves to an object containing the `challenge` as an ArrayBuffer and the `rpId` as a String.
     */
    getAuthnChallenge() {
        var challengeBytes = new Uint8Array(16);
        window.crypto.getRandomValues(challengeBytes);

        this.authnChallenge = challengeBytes;

        return Promise.resolve({
            challenge: challengeBytes,
            rpId: this.rpId
        });
    }

    sendAuthnResponse(resp) {
        // cleanup
        this.authnChallenge = null;
    }
}

class WebAuthnTransaction {
    constructor() {

    }

    register() {

    }

    authenticate() {

    }
}

/* JSHINT */
/* exported FidoLocalStorage, FidoServerComm, WebAuthnWrapper */