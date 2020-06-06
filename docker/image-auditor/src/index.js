// Import dgram module and create udp socket
const dgram = require('dgram');
const s = dgram.createSocket('udp4');
const net = require('net');
var moment = require('moment');

const instruments = new Map();
instruments.set("ti-ta-ti", "piano");
instruments.set("pouet", "trumpet");
instruments.set("trulu", "flute");
instruments.set("gzi-gzi", "violin");
instruments.set("boum-boum", "drum");

let orchestra = new Map();

s.bind(2206, function() {
    console.log("Auditor joining multicast group");
    s.addMembership('239.255.23.5');
});

// This call back is invoked when a new datagram has arrived.
s.on('message', function(msg, source) {
    console.log("Musician has arrived: '" + msg + "'. Source address: " + source.address + ", source port: " + source.port + "\n");

    let msgParse = JSON.parse(msg);
    if(!orchestra.has(msgParse.uuid)) {
        let musician = {
            instrument: instruments.get(msgParse.sound),
            activeSince: msgParse.activeSince,
            timeoutFunction:
                setTimeout((uuid) => {
                if(moment().diff(orchestra.get(uuid).activeSince) > 5000) {
                    orchestra.delete(uuid);
                }
            }, 5000, msgParse.uuid)
        };
        orchestra.set(msgParse.uuid, musician);
    }
    else{
        const musician =  orchestra.get(msgParse.uuid);
        musician.activeSince = msgParse.activeSince;
        musician.timeoutFunction.refresh();
    }

});

function musicienFormat(key, values){
    return {
        uuid: key,
        instrument: values.instrument,
        activeSince: values.activeSince
    };
}

let server = net.createServer(function(socket) {
    let orchestraParse = Array.from(orchestra, ([key, val]) => musicienFormat(key, val));
    const message = Buffer.from(JSON.stringify(orchestraParse));
    socket.write(message);
    socket.pipe(socket);
});

server.listen(2205);
