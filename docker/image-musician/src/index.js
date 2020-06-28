/**
 * Define the protocol for the musician
 * @author Müller Robin, Teixeira Carvalho Stéphane
 */
const protocol = require('./protocol');

// Import uuiv4 (random uuid)
const {v4: uuidv4} = require('uuid');

// Import dgram module and create udp socket
const dgram = require('dgram');
const s = dgram.createSocket('udp4');

// Creation of a map containing the instrument and his sound
const instruments = new Map();
instruments.set("piano", "ti-ta-ti");
instruments.set("trumpet", "pouet");
instruments.set("flute", "trulu");
instruments.set("violin", "gzi-gzi");
instruments.set("drum", "boum-boum");

// Check that only one parameter is passed
if (process.argv.length !== 3) {
    console.log("Invalid arguments for musician.");
    process.exit(-1);
}

// Check that the instrument passed is in the list of instrument
const instrumentName = process.argv[2];
if (!instruments.has(instrumentName)) {
    console.log("The instrument is invalid.");
    process.exit(-1);
}

// Format the musician to send the sound and uuuid
const musician = {
    sound: instruments.get(instrumentName),
    uuid: uuidv4()
};

// Convert the musician in JSON format and add it in the buffer
const message = Buffer.from(JSON.stringify(musician));
// Send a message every 1 second of the sound and uuid
setInterval(() => {
    s.send(message, 0, message.length, protocol.udp.multicast_port, protocol.udp.multicast_address, ((error, bytes) => {
        console.log(`Sending ${musician.sound} via port ${s.address().port}`);
    }));
}, 1000);
