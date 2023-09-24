var express = require("express"); 
var app = express();
var bodyParser = require("body-parser");
var path = require("path")
var uuid = require('uuid-random');

const { uniqueNamesGenerator, adjectives, colors, animals, names } = require('unique-names-generator');

// Running our server on port 3080
var PORT  = process.env.PORT || 3080

var server = app.listen(PORT, function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Listening at http://%s:%s', 'localhost:', port);
});

app.use(bodyParser.json());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var io = require('socket.io')(server)
 // Socket.IO服务器能够监听HTTP服务器的连接，并与客户端进行实时通信
 // 在同一端口同时处理HTTP请求以及Socket.io通信

var chatRoomData=[] //用于存储以及展示聊天数据
var connectedClients={} //使用uuid跟踪当前用户

io.on('connection',(client)=>{
  // 这一段代码都是形如
  // client.on('Method Name', (dataSent) => {
  //  some code that uses dataSent
  //  })
  // 这是Socket.io库的用法，作用是为Socket.IO客户端对象注册时间处理程序
  // 当事件 Method Name 被触发时，会使用后面作为参数的匿名函数处理，并且将 dataSend作为参数传入

  console.log("New client connected");

  client.on("SendMessage",(messageData)=>{
    chatRoomData.push(messageData)
    sendUpdatedChatRoomData(client)
  })

  client.on("UserEnteredRoom", (userData) => {
    var enteredRoomMessage = {message:`${userData.username} has entered the chat `,username: "", userID: 0, timeStamp: null}
    chatRoomData.push(enteredRoomMessage)
    sendUpdatedChatRoomData(client)
    connectedClients[client.id]=userData
  })

  client.on("CreateUserData", ()=>{
    let userID=uuid();
    let username=uniqueNamesGenerator({dictionaries:[adjectives,names]});
    var userData={userID:userID, username:username}
    client.emit("SetUserData",userData)
  });

  client.on('disconnecting', (data)=>{
    console.log("Client disconnecting...");

    if(connectedClients[client.id]){
      var leftRoomMessage={message:`${connectedClients[client.id].username} has left the chat`,username:"",userID:0,timeStamp:null}
      chatRoomData.push(leftRoomMessage)
      sendUpdatedChatRoomData(client)
      delete connectedClients[client.id]
    }
  });

  client.on('ClearChat', ()=>{
    chatRoomData=[];
    console.log(chatRoomData);
    sendUpdatedChatRoomData(client)
  })

})


// emit函数用于服务器向客户端发送数据
// 而这个函数的目的是将更新后的聊天室数据发送给连接到的所有客户端
// (在线？离线？)
// 第一个emit是向当前的 一个 客户端发送，第二个是向剩下的全部
function sendUpdatedChatRoomData(client){
  client.emit("RetrieveChatRoomData",chatRoomData);
  client.broadcast.emit("RetrieveChatRoomData",chatRoomData)
}