// make a websocket thing to talk to the flaschentashen.

var WebSocketServer = require('ws').Server;
var SERVER_PORT = 8081;               // port number for the webSocket server
var wss = new WebSocketServer({port: SERVER_PORT}); // the webSocket server


var connections = new Array;          // list of connections to the server

var flaschen = require('flaschenode');

wss.on('connection', handleConnection);


flaschen.layer = 15
flaschen.init();
flaschen.width = 9

flaschen.height = 9;

var datb = new Buffer( flaschen.headerString().length+ flaschen.footerString().length + flaschen.height* flaschen.width*3)
flaschen.data = datb;

datb.write(flaschen.headerString(), 0);
var starfoo = datb.length - flaschen.footerString().length
datb.write(flaschen.footerString(), starfoo);


var color = [5, 5, 5];
for(i=0; i < flaschen.width; i++){
  for(j=0; j < flaschen.height; j++){
    flaschen.set(i, j, color);
  }
}



flaschen.show();

function handleConnection(client) {
 console.log("New Connection"); // you have a new client

    connections.push(client); // add this client to the connections array

    client.on('message', sendToFlaschen); // when a client sends a message,

    client.on('close', function() { // when a client closes its connection
       console.log("connection closed"); // print it out
       var position = connections.indexOf(client); // get the client's position in the array
       connections.splice(position, 1); // and delete it from the array
    });


}

function sendToFlaschen(data){
  //console.log("Got info from the client it is: " + data);
  var datarr = data.split('\n');

  for(d of datarr){

    try{
      var djson = JSON.parse(d);

      var color = djson.color;

      console.log(flaschen.hostname, 'on layer', flaschen.layer)

      console.log('should be showing ', djson.xin, djson.yin, color)

      flaschen.set(djson.xin, djson.yin, color);

    }
    catch(e){
      console.log(e)
    }
  }
  flaschen.show();
}
