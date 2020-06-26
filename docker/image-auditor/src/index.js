// Import dgram module and create udp socket
const dgram = require('dgram');
const s = dgram.createSocket('udp4');
const net = require('net');
const moment = require('moment');

const instruments = new Map();
const orchestra = new Map();

instruments.set("ti-ta-ti", "piano");
instruments.set("pouet", "trumpet");
instruments.set("trulu", "flute");
instruments.set("gzi-gzi", "violin");
instruments.set("boum-boum", "drum");

function getMusicianTimeout(uuid) {
    // Timeout function is ran after 6 seconds and checks if the musician is inactive
    return setTimeout(() => {
        if(moment().diff(orchestra.get(uuid).lastSeen) > 5000) {
            orchestra.delete(uuid);
        }
    }, 6000)
}

function musicianFormat(key, values){
    return {
        uuid: key,
        instrument: values.instrument,
        activeSince: values.activeSince
    };
}

s.bind(2206, function() {
    console.log("Auditor joining multicast group");
    s.addMembership('239.255.23.5');
});

// This call back is invoked when a new datagram has arrived.
s.on('message', (msg, source) => {
    console.log("Musician has arrived: '" + msg + "'. Source address: " + source.address + ", source port: " + source.port + "\n");
    let {uuid, sound} = JSON.parse(msg);
    let curTime = new Date();
    if(!orchestra.has(uuid)) {
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

let server = net.createServer(function(socket) {
    let orchestraParse = Array.from(orchestra, ([key, val]) => musicianFormat(key, val));
    const message = Buffer.from(JSON.stringify(orchestraParse));
    socket.write(message);
    socket.pipe(socket);
    socket.end();
});

server.listen(2205);
