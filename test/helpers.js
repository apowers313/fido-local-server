var testCredId = new Uint8Array(162);
window.crypto.getRandomValues(testCredId);
testCredId = testCredId.buffer;

/* JSHINT */
/* exported testCredId */