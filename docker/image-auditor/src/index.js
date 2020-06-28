/**
 * Define the protocol for the auditor
 * @author Müller Robin, Teixeira Carvalho Stéphane
 */
// Import dgram module and create udp socket
const dgram = require('dgram');
const s = dgram.createSocket('udp4');
const net = require('net');
const moment = require('moment');
const protocol = require('./protocol')

// Creation of 2 map one containing the sounds and instruments and the other will contain the musician
const instruments = new Map();
const orchestra = new Map();

instruments.set("ti-ta-ti", "piano");
instruments.set("pouet", "trumpet");
instruments.set("trulu", "flute");
instruments.set("gzi-gzi", "violin");
instruments.set("boum-boum", "drum");

/**
 * Check if the last time a musician sent a sound. If it is over 5 the musican is erased from the orchestra
 * @param uuid The uuid of the musician
 * @returns {number} Return the ID of the timeout setted
 */
function getMusicianTimeout(uuid) {
    // Timeout function is ran after 6 seconds and checks if the musician is inactive
    return setTimeout(() => {
        if(moment().diff(orchestra.get(uuid).lastSeen) > 5000) {
            orchestra.delete(uuid);
        }
    }, 6000)
}

/**
 * Format a musician to send the values of it
 * @param uuid value that represents the uuid of the musician
 * @param values array containing the instrument and the activeSince value of a musician
 * @returns an object containing the following values {{activeSince: *, instrument: *, uuid: *}}
 */
function musicianFormat(uuid, values){
    return {
        uuid: uuid,
        instrument: values.instrument,
        activeSince: values.activeSince
    };
}

// Add the application to the multicast group of musicians
s.bind(protocol.udp.multicast_port, function() {
    console.log("Auditor joining multicast group");
    s.addMembership(protocol.udp.multicast_address);
});

// This call back is invoked when a new datagram has arrived.
s.on('message', (msg, source) => {
    console.log("Musician has arrived: '" + msg + "'. Source address: " + source.address + ", source port: " + source.port + "\n");
    let {uuid, sound} = JSON.parse(msg);
    let curTime = new Date();
    // Check if the musician recieved is in the orchestra or not
    if(!orchestra.has(uuid)) {
        // If the musician is not in the orchestra we set the activeSince
        let musician = {
            instrument: instruments.get(sound),
            activeSince: curTime,
            lastSeen: curTime,
            timeoutFunction: getMusicianTimeout(uuid)
        };
        orchestra.set(uuid, musician);
    } else {
        const musician = orchestra.get(uuid);
        musician.lastSeen = curTime;
        musician.timeoutFunction.refresh();
    }
});

// Create a TCP server that responds by sending the orchestra when a client connect to the port specified in protocol.js
let server = net.createServer(function(socket) {
    let orchestraParse = Array.from(orchestra, ([key, val]) => musicianFormat(key, val));
    const message = Buffer.from(JSON.stringify(orchestraParse));
    socket.write(message);
    socket.pipe(socket);
    socket.end();
});

server.listen(protocol.tcp.port);
