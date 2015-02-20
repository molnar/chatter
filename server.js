var app = require('express')(),
    bodyParser = require('body-parser'),
    http = require('http').Server(app),
    io = require('socket.io')(http);

var mongo = require('mongodb');
var MongoClient = require('mongodb').MongoClient,
    BSON = mongo.BSONPure,
    Server = require('mongodb').Server,
    db;

app.use(bodyParser.urlencoded({ extended: false })); 
app.use(bodyParser.json());
app.use(function(req, res, next) {
  //to allow crossdomain locally
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
 //http://stackoverflow.com/questions/7067966/how-to-allow-cors-in-express-nodejs
  next();
});






app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){


  var mongoClient = new MongoClient(new Server('localhost', 27017));
  mongoClient.open(function(err, mongoClient) {
      db = mongoClient.db("chatdb01");
      db.collection('chat', {strict:true}, function(err, collection) {
          if (err) {
              console.log("The 'staff' collection doesn't exist. Creating it with sample data...");
              
          }
          if(collection){
            collection.find().sort({ _id : 1 }).limit(50).toArray(function(err, items) {
                //console.log(items)
                for (i = 0; i < items.length; i++) { 
                   var chat = items[i];
                   var data = {
                     "name":chat.name,
                     "message":chat.message                    
                   }
                   io.emit('chat message', data);
                }
               
            });
          /*  var stream = collection.find().sort({ _id : -1 }).limit(10).stream();
            console.log(stream)*/
            //stream.on('data', function (chat) { socket.emit('chat', chat); });
          }
      });
  });













  //console.log('a user connected'); 
  var data = {
    "name":"MGMT",
    "message":"a user connected"
  };
  io.emit('chat message', data);
  

  socket.on('disconnect', function(){
	  //console.log('user disconnected');
    var data = {
      "name":"MGMT",
      "message":"a user disconnected"
    };
    io.emit('chat message', data);
	});

  socket.on('chat message', function(msg){
     //console.log('message: ' + msg);
     io.emit('chat message', msg);
     db.collection('chat', function(err, collection) {
         collection.insert(msg, {safe:true}, function(err, result) {
            console.log(result)
         });
     });
   });

});

http.listen(1717, function(){
	console.log('Listening on *:1717')
});