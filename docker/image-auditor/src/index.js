// Import dgram module and create udp socket
const dgram = require('dgram');
const s = dgram.createSocket('udp4');

const instruments = new Map();
instruments.set("ti-ta-ti", "piano");
instruments.set("trumpet", );
instruments.set("flute", "trulu");
instruments.set("violin", "gzi-gzi");
instruments.set("drum", "boum-boum");



s.bind(2206, function() {
    console.log("Auditor joining multicast group");
    s.addMembership('239.255.23.5');
});

// This call back is invoked when a new datagram has arrived.
s.on('message', function(msg, source) {
    console.log("Ad has arrived: '" + msg + "'. Source address: " + source.address + ", source port: " + source.port);
});
