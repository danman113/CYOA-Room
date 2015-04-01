var port=81;
var app=require('express')();
var http=require('http').Server(app);
var io=require('socket.io')(http);
var sanitizer = require('sanitizer');
var path=__dirname+'/html/';