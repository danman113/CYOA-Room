var socket=io();
var name;
var refresh=1;
var users=[];
var messages=[];
var story=[];
var masterDictionary=[{match:'color',replace:'span',arg1:'style="color:',arg2:'"'},{match:'fullimage',replace:'img',arg1:' src="',arg2:'"'}];
var dictionary=[{match:'italics',replace:'i'},{match:'bold',replace:'b'},{match:'b',replace:'b'},{match:'i',replace:'i'},{match:'link',replace:'a',arg1:'target="_blank" href="',arg2:'"'},{match:'img',replace:'img',arg1:' class="image" src="',arg2:'"'},{match:'image',replace:'img',arg1:' class="image" src="',arg2:'"'},{match:'a',replace:'a',arg1:'target="_blank" href="',arg2:'"'},{match:'red',replace:'span style="color:red" '},{match:'blue',replace:'span style="color:blue" '},{match:'green',replace:'span style="color:green" '},{match:'purple',replace:'span style="color:purple" '},{match:'rainbow',replace:'span class="rainbow" '},{match:'magenta',replace:'span style="color:#AD1C89" '},{match:'orange',replace:'span style="color:orange" '},{match:'grey',replace:'span style="color:grey" '},{match:'brown',replace:'span style="color:brown" '},{match:'teal',replace:'span style="color:teal" '}];
masterDictionary=masterDictionary.concat(dictionary);
var votes=[];
var audio=document.createElement('audio');
audio.src="waterDropClick.mp3";
function init(){
	getUserName();
	mainLoop();
	rainbow();
}

function getUserName(){
	name=prompt("What do you want your username to be?");
	if(name=="" || name==null || name=="null")
		getUserName();
	name=name.trim();
	socket.emit('handshake',name);
	socket.on('handshake',function(hasName){
		if(!hasName){
			alert('Error: that name is either already taken or you\'re trying to connect with more than one window!');
			getUserName();
		}
	});
	if(admin){
		socket.emit('reqAdmin');
		socket.on('reqAdmin',function(status){
			if(!status){
				alert('Your request to become an admin has been denied');
				admin=false;
			} else {
				alert('Congrats, you\'re an admin');
				admin=true;
			}
		});
	}
}
socket.on('updateUsers',function(usrs){
	if(usrs.length>users.length){
		audio.play();
	}
	users=usrs;
	updateUsers();
});
socket.on('updateChat',function(data){
	var newd=false;
	if(data.length>messages.length){
		newd=true;
	}
	messages=data;
	updateChat();
	if(newd){
		audio.play();
		scrollDown();
	}
});
socket.on('updateStory',function(data){
	var newd=false;
	if(data.length>story.length){
		newd=true;
	}
	story=data;
	updateStory();
	if(newd){
		audio.play();
		storyDown();
	}
});
socket.on('updateVotes',function(data){
	votes=data;
	if(document.URL.substring(document.URL.length-10,document.URL.length)!="admin.html")
	updateVotes();
});
socket.on('sendMsg',function(resp){
	if(!resp){
		alert("You need to chose a name before you can chat!");
		getUserName();
	}
});
socket.on('storyUpload',function(resp){
	if(!resp){
		alert("You are not an Admin!");
	}
});
socket.on('getVotes',function(data){
	addData(data);
});
var rainbowOn=false;
function mainLoop(){
	socket.emit('updateUsers');
	socket.emit('updateChat');
	socket.emit('updateStory');
	socket.emit('updateVotes');
	if(admin)
		socket.emit('getVotes');
	setTimeout(mainLoop,1000/refresh);
}
function scrollDown(){
	var scroll=document.getElementById('windowChat');
	scroll.scrollTop=scroll.scrollHeight;
}
function storyDown(){
	var scroll=document.getElementById('windowStory');
	scroll.scrollTop=scroll.scrollHeight;
}
function updateChat(){
	var element=document.getElementById('chat');
	var str="";
	for(var i=0;i<messages.length;i++){
		if(messages[i].loading==true)
			str+="<li><span style='color:red'>*</span><b>"+messages[i].name+"</b>: "+bbCode(messages[i].message,dictionary)+"</li>";
		else
			str+="<li><b>"+messages[i].name+"</b>: "+bbCode(messages[i].message,dictionary)+"</li>";
	}
	element.innerHTML=str;
	rainbow();
}

function updateStory(){
	var element=document.getElementById('windowStory');
	var str="";
	for(var i=0;i<story.length;i++){
		if(story[i].loading==true)
			str+="<span style='color:red'>*</span><p>"+bbCode(story[i].message.replace(/\n/g,'</p><p>'),masterDictionary)+"</p>";
		else
			str+="<p>"+bbCode(story[i].message.replace(/\n/g,'</p><p>'),masterDictionary)+"</p>";
	}
	element.innerHTML=str;
	rainbow();
}

function updateUsers(){
	var element=document.getElementById('users');
	var str="";
	for(var i=0;i<users.length;i++){
		str+="<li><b>"+users[i].name+"</b></li>";
	}
	element.innerHTML=str;
}

function sendMessage(){
	var element=document.getElementById('message');
	var value=element.value;
	if(value=="" || value==null)
		return false;
	socket.emit('sendMsg',{message:value});
	element.value="";
	messages.push({name:name,message:value,loading:true});
	updateChat();
	scrollDown();
}

function bbCode(words,dictionary){
	if(dictionary==null || dictionary==undefined)
		dictionary=[];
	for(var i=0;i<dictionary.length;i++){
		if(dictionary[i].arg1===undefined || dictionary[i].arg2===undefined){
			var exp='\\[['+dictionary[i].match+']{'+dictionary[i].match.length+'}\\](.+)\\[\\/['+dictionary[i].match+']{'+dictionary[i].match.length+'}\\]';
			words=words.replace(new RegExp(exp,'g'),'<'+dictionary[i].replace+'>$1</'+dictionary[i].replace+'>');
		} else {
			var exp='\\[['+dictionary[i].match+']{'+dictionary[i].match.length+'}\\=(.+)\\](.+)\\[\\/['+dictionary[i].match+']{'+dictionary[i].match.length+'}\\]';
			words=words.replace(new RegExp(exp,'g'),'<'+dictionary[i].replace+' '+dictionary[i].arg1+'$1'+dictionary[i].arg2+'>$2</'+dictionary[i].replace+'>');
		}
	}
	return words;
}

function sendStory(){
	if(admin){
		var element=document.getElementById('story');
		var A=document.getElementById('A');
		var B=document.getElementById('B');
		var C=document.getElementById('C');
		var D=document.getElementById('D');
		var options=[];
		if(A.value.trim()!=null && A.value.trim()!="null" && A.value.trim()!=""){
			options.push(A.value.trim());
			A.value="";
		}
		if(B.value.trim()!=null && B.value.trim()!="null" && B.value.trim()!=""){
			options.push(B.value.trim());
			B.value="";
		}
		if(C.value.trim()!=null && C.value.trim()!="null" && C.value.trim()!=""){
			options.push(C.value.trim());
			C.value="";
		}
		if(D.value.trim()!=null && D.value.trim()!="null" && D.value.trim()!=""){
			options.push(D.value.trim());
			D.value="";
		}
		var words=element.value;
		element.value="";
		socket.emit('storyUpload',{message:words,votes:options});
		story.push({message:words,loading:true});
		updateStory();
		storyDown();
	} else {
		alert('You\'re not an admin!');
	}
}

function updateVotes(){
	for(var i=0;i<votes.length;i++){
		var span=document.getElementById(i.toString());
		span.innerHTML=votes[i];
	}
	for(;i<4;i++){
		var span=document.getElementById(i.toString());
		span.innerHTML="";
	}
}

function sendVotes(){
	var candidates=document.getElementsByName('option');
	var winner=-1;
	for(var i=0;i<candidates.length;i++){
		if(candidates[i].checked){
			winner=i;
		}
	}
	if(winner>-1){
		socket.emit('vote',winner);
	}
}

function addData(votes){
	var candidates=document.getElementById('results');
	var str="";
	for(var i=0;i<votes.length;i++){
		str+="<strong>"+votes[i].message+"</strong>: "+votes[i].votes+"<br/>";
	}
	candidates.innerHTML=str;
}


function rand(in1,in2,round){
	if(round==undefined)
		round=0;
	return Number(((Math.random()*(in2-in1))+in1).toFixed(round));
}

function rainbow(recurse){
	var rainbows=document.getElementsByClassName('rainbow');
	for(var i=0;i<rainbows.length;i++){
		var color="rgba("+rand(0,255)+","+rand(0,255)+","+rand(0,255)+",1)";
		rainbows[i].style.color=color;
	}
	if(recurse==undefined)
	setTimeout(rainbow,1000/3);
}