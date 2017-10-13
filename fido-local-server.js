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
((function () {
    /**
     * Stores and retreives credentials using indexeddb
     */
    class FidoLocalStorage {
        constructor() {
        }

        saveCredential() {

        }

        getCredentials(cred) {

        }
    }

    /**
     * Class for communicating to a FIDO server. Currently a "local" server.
     */
    class FidoServerComm {
        constructor() {
            // should get the host:port of the server to be used as the Relying Party ID
            this.rpId = window.location.origin.replace(/^http(s)?:\/\//, "");
            console.log ("RP ID:", this.rpId);
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

    class WebAuthnWrapper {
        constructor() {

        }

        register() {

        }

        authenticate() {

        }
    }
})());