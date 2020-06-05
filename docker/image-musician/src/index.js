// Import uuiv4 (random uuid)
const {v4: uuidv4} = require('uuid');

// Import dgram module and create udp socket
const dgram = require('dgram');
const s = dgram.createSocket('udp4');

const instruments = new Map();
instruments.set("piano", "ti-ta-ti");
instruments.set("trumpet", "pouet");
instruments.set("flute", "trulu");
instruments.set("violin", "gzi-gzi");
instruments.set("drum", "boum-boum");

if (process.argv.length !== 3) {
    console.log("Invalid arguments for musician.");
    process.exit(-1);
}

const instrumentName = process.argv[2];
if (!instruments.has(instrumentName)) {
    console.log("The instrument is invalid.")
    process.exit(-1);
}
const sound = instruments.get(instrumentName);
const uuid = uuidv4();

const musician = {
    sound: sound,
    uuid: uuid
}

const message = Buffer.from(JSON.stringify(musician));
setInterval(() => {
    s.send(message, 0, message.length, 2206, '239.255.23.5', ((error, bytes) => {
        console.log(`Sending ${sound} via port ${s.address().port}`);
    }));
}, 1000);
