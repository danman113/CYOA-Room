var port=80;
var app=require('express')();
var http=require('http').Server(app);
var io=require('socket.io')(http);
var sanitizer = require('sanitizer');
var path=__dirname+'/html/';
var fs=require('fs');
var users=[];
var messages=[];
var story=[];
var votes=[];
var err404=getFileData(path+'404.html');

app.get('/index.html',function(req,res){
	res.sendFile(path+"/index.html");
});
app.get('/',function(req,res){
	res.send("<a href='index.html"+"'>To Game</a>");
});

http.listen(port, function(){
	console.log("Server started! Listening on port "+port+".");
});

io.on('connection',mainConnection);
function mainConnection(socket){
	var connection=new user(socket,"user",0);
	users.push(connection);
	console.log(connection.ip+" joined");
	socket.on('disconnect',function(){
		console.log(connection.ip+" dCed :C");
		//removeUser(connection);
		connection.online=false;
		if(connection.level==9001){
			cleanup();
		}
		console.log("Users left: "+users.length);
	});

	socket.on('updateUsers',function(msg){
		var tempUsers=[];
		for(var i=0;i<users.length;i++){
			if(users[i].name!='user' && users[i].online)
			tempUsers.push({name:users[i].name,lvl:users[i].level});
		}
		socket.emit('updateUsers',tempUsers);
	});
	socket.on('updateChat',function(msg){
		socket.emit('updateChat',messages);
	});
	socket.on('updateStory',function(msg){
		socket.emit('updateStory',story);
	});
	socket.on('vote',function(voteIndex){
		if(voteIndex>=0 && voteIndex<votes.length && connection.name!='user' && !connection.voted){
			votes[voteIndex].votes++;
			console.log("Vote casted for "+votes[voteIndex].message+" by "+connection.name);
			connection.voted=true;
		}
	});
	socket.on('updateVotes',function(msg){
		var opts=[];
		for(var i=0;i<votes.length;i++){
			opts.push(votes[i].message);
		}
		socket.emit('updateVotes',opts);
	});
	socket.on('sendMsg',function(msg){
		if(connection.name!='user'){
			msg.message=sanitizer.escape(msg.message);
			msg.name=connection.name;
			msg.level=connection.level;
			messages.push(msg);
			socket.emit('sendMsg',true);
		} else {
			socket.emit('sendMsg',false);
		}
	});
	socket.on('handshake',function(name){
		var taken=nameTaken(name,connection.ip);
		if(taken!=-2){
			if(taken>-1){
				connection=users[taken];
				connection.online=true;
			} else
			socket.emit('handshake',false);
		} else {
			socket.emit('handshake',true);
			connection.name=name;
		}
	});
	socket.on('reqAdmin',function(){
		var taken=hasAdmin();
		if(taken){
			socket.emit('reqAdmin',false);
		} else {
			socket.emit('reqAdmin',true);
			connection.level=9001;
		}
	});
	socket.on('getVotes',function(msg){
		if(connection.name!='user' && connection.level==9001 && votes.length>0){
			socket.emit('getVotes',votes);
		}
	});
	socket.on('storyUpload',function(msg){
		if(connection.name!='user' && connection.level==9001){
			msg.message=sanitizer.escape(msg.message);
			if(msg.votes.length>0){
				var newVotes=[];
				for(var i=0;i<msg.votes.length;i++){
					newVotes.push(new vote(msg.votes[i]));
				}
				votes=newVotes;
				console.log(votes);
				cleanVotes();
			} else {
				votes=[];
			}
			cleanup();
			story.push(msg);
			socket.emit('storyUpload',true);
		} else {
			socket.emit('storyUpload',false);
		}
	});
}

function user(socket,name,level){
	this.socket=socket;
	this.id=socket.id;
	this.ip=socket.request.connection.remoteAddress;
	this.name=name;
	this.level=level;
	this.voted=false;
	this.online=true;
}

function message(message,name,level){
	this.message=message;
	this.name=sanitizer.escape(name);
	this.level=level;
}

function vote(message){
	this.message=sanitizer.escape(message);
	this.votes=0;
}

function removeUser(user){
	for(var i=0;i<users.length;i++){
		if(users[i]==user){
			users.splice(i,1);
			return true;
		}
	}
	return false;
}

function nameTaken(name,ip){
	if(name=='user')
		return true;
	for(var i=0;i<users.length;i++){
		if(users[i].name==name){
			return -1;
		}
		if(users[i].ip==ip && users[i].name!='user'){
			if(users[i].online)
			return -1;
			else return i;
		}
	}
	return -2;
}

function cleanVotes(){
	for(var i=0;i<users.length;i++){
		users[i].voted=false;
	}
}

function getFileData(url){
	fs.readFile(url,function(err,file){
		if(err){
			return null;
		}
		return file;
	});
}

function cleanup(){
	var delList=[];
	for(var i=0;i<users.length;i++){
		if(!users[i].online){
			delList.push(i);
		}
	}
	console.log("Deleted "+delList.length+" users.");
	for(var i=delList.length-1;i>=0;i--){
		users.splice(delList[i],1)
	}
	console.log(users.length+" remain");
	console.log(users);
}
function hasAdmin(){
	for(var i=0;i<users.length;i++){
		if(users[i].level==9001 && users[i].online){
			return true;
		}
	}
	return false;
}

setTimeout(cleanup,1000*30);
app.get('*', function(req,res){
	var pathname=req._parsedUrl.pathname.substring(1,req._parsedUrl.pathname.length);
	fs.open(path+pathname,'r',function(err,file){
		if(err==null){
			res.sendFile(path+pathname);
		}else{
			res.send(path+pathname+err404);
			//res.sendFile(path+'404.html');		
		}
	});

});
