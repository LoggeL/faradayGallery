onmessage = async function(e) {
    let i = 0;
    let hashInput, hashResult
    do {
        i++;
        hashInput = e.data.input + i.toString('16');
        hashResult = await hash(hashInput);
    } while (hashResult.slice(e.data.complexity * -1) != '0'.repeat(e.data.complexity))
    postMessage(i.toString('16'));
}

// Hash function
function hash(string) {
    const utf8 = new TextEncoder().encode(string);
    return crypto.subtle.digest('SHA-256', utf8).then((hashBuffer) => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
        .map((bytes) => bytes.toString(16).padStart(2, '0'))
        .join('');
        return hashHex;
    });
}