var testCredId = new Uint8Array(16);
window.crypto.getRandomValues(testCredId);
testCredId = testCredId.buffer;

/* JSHINT */
/* exported testCredId */