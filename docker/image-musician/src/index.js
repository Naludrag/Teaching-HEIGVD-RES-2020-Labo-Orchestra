const protocol = require('./protocol');

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

const musician = {
    sound: instruments.get(instrumentName),
    uuid: uuidv4()
};
const message = Buffer.from(JSON.stringify(musician));

setInterval(() => {
    s.send(message, 0, message.length, protocol.udp.multicast_port, protocol.udp.multicast_address, ((error, bytes) => {
        console.log(`Sending ${musician.sound} via port ${s.address().port}`);
    }));
}, 1000);
