var flatiron = require('flatiron'),
    app = flatiron.app,
    ecstatic = require('ecstatic'),
    passport = require('flatiron-passport'),
    plates = require('plates'),
    path = require('path'),
    mime = require('mime'),
    mongoose = require('mongoose');
app.path = path;
app.mime = mime;
var io = require('socket.io').listen(9040, { log: false });
var io_client = require('socket.io-client');
var fs = require('fs');
var wkhtmltopdf = require('wkhtmltopdf');
//var time = require('time');
var CronJob = require('cron').CronJob;
var nodemailer = require("nodemailer");
Date.prototype.yyyymmdd = function() {
   var yyyy = this.getFullYear().toString();
   var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
   var dd  = this.getDate().toString();
   return yyyy +"-"+ (mm[1]?mm:"0"+mm[0]) +"-" +(dd[1]?dd:"0"+dd[0]); // padding
  };
var date = new Date();
console.log(date.yyyymmdd());
//a = new time.Date();
//a.setTimezone('Asia/Calcutta');
//console.log(a.toString(), a.currentTimeZone)
var mailOptions = {};
var transport = nodemailer.createTransport("SMTP", {
    host: "smtp.gmail.com", // hostname
    secureConnection: true, // use SSL
    port: 465, // port for secure SMTP
    auth: {
        user: "uneedtomailme@gmail.com",
        pass: "rajendra28"
    }
});
app.transport = transport;

// send mail with defined transport object



app.fs = fs;
// Set up app.config to use ../config.json to get and set configuration settings.
app.config.file({ file: path.join(__dirname, '../config.json') });
app.use(require('connect').bodyParser());
//setup mongoose
app.db = mongoose.createConnection(app.config.get('mongoUri') || 'mongodb://localhost/flexydial-example');
app.db.on('error', console.error.bind(console, 'mongoose connection error: '));
app.db.once('open', function () {});
app.edit = '';
app.io_client = io_client;
app.io = io;
//app.dl = dl;
app.allClients = [];
app.editSocket='';
//import the models here
require('./models/user')(app, mongoose);
require('./models/client')(app, mongoose);
require('./models/did')(app, mongoose);
require('./models/account_detail')(app, mongoose);
require('./models/call_detail')(app, mongoose);
require('./models/extension')(app, mongoose)
require('./models/welcomeDid')(app, mongoose)
require('./models/address_book')(app, mongoose)
require('./models/list_addressbook')(app, mongoose)
require('./models/voicemail')(app, mongoose)
require('./models/region')(app, mongoose)
require('./models/did_blacklist')(app, mongoose)
require('./models/blacklist')(app, mongoose)
require('./models/whitelist')(app, mongoose)
require('./models/stickyAgent')(app, mongoose)
//import the views here
Views = require('./views');
//setup http
app.use(flatiron.plugins.http)
//app.use(flatiron.plugins.http, {buffer: false});
app.http.before = [
  ecstatic(__dirname + '/../assets', { autoIndex : false})
]

//setup passport for authentication
app.use(passport);
require('./passport')(app, passport);

//setup to handle route requests
require('./routes')(app, plates, passport);

//start the server
app.start(app.config.get('port')||8000,'0.0.0.0', function (err) {
  if (err) {
    throw err;
  }

  var addr = app.server.address();
/*  var socket = io_client.connect('192.168.1.15:9030', {reconnect: true});
   // Add a connect listener
    socket.emit('File Upload Done', { path : '/etc/freeswitch/upload', did : '5000' });
   socket.on('connect', function(socket) { 
       console.log('NMS Client Connected!');
});*/
io.sockets.on('connection', function (socket) {  
        console.log("Namah Shivaya!! CDR");
    socket.on('cdr', function (data) {
        console.log(data);
        app.db.models.call_detail.create(data, function (err, userobj) {
        if(!err){
         console.log(data);
        }
    });
   });
    socket.on('voicemail', function (data) {
        console.log(data);
        app.db.models.voicemail.create(data, function (err, userobj) {
        if(!err){
         console.log(data);
        }
    });
   });
    socket.on('account', function (data) {
        console.log(data);
        app.db.models.account_detail.update({client_id: data[0].client_id}, {$set: {credit_balance: data[0].credit_balance}}, {upsert: true}).exec(function (err, userobj) {
        if(!err){
         console.log(data);
        }
    });
   });

  });


var job = new CronJob({
  cronTime: '00 42 16 * * 1-6',
  onTick: function() {
  console.log("CRON JOB STARTED");
var filters ={};
var cdrFilters ={};
filters.roles =  new RegExp('^.*?'+ 'user' +'.*$', 'i'); 
app.db.models.user.find(filters,'username email').lean().exec(function (err, client) {
  if(!err){
  console.log(client)
  cdrFilters.timeCreated =  new RegExp('^.*?'+ date.yyyymmdd() +'.*$', 'i'); 
/*  for(var i=0;i<client.length;i++){
  cdrFilters.client_id =  new RegExp('^.*?'+ client[i].client_name +'.*$', 'i');
 
 app.db.models.call_detail.find(cdrFilters,'').lean().exec(function (err, report) {
   if ( report.length > 0)
    {	
     var client_id = report[0].client_id;
     //console.log(data[i]);
     var resultList = "";
     for(var i=0;i<report.length;i++) {
       resultList += '<tr><td>' 
       + report[i].did_number + '</td><td>'
       + report[i].incoming_phone_number + '</td><td>'
       + report[i].client_id + '</td><td>'
       + report[i].call_time + '</td><td>'
       + report[i].duration + '</td><td>'
       + report[i].no_of_pulse + '</td><td>'
       + report[i].hangup_cause + '</td></tr>'
     }
     var now = new Date();
     var resultHtml = " <html> <h2> Date : "+ now.toString() +" </h2> <body> <table border = '2' ><thead>" + 
        "<tr>" +
        "<th style=\"background-color: darkgray;\">DID Number</th>" + 
        "<th style=\"background-color: darkgray;\">Incoming Phone Number</th>"+
        "<th style=\"background-color: darkgray;\">Client Name</th>"+
        "<th style=\"background-color: darkgray;\">Call Time</th>"+
        "<th style=\"background-color: darkgray;\">Duration</th>"+
        "<th style=\"background-color: darkgray;\">No. Of Pulse</th>"+
        "<th style=\"background-color: darkgray;\">Hang Up Cause</th>"+
        "</tr> </thead><tbody>" +resultList+"</tbody>" +
        " </table>*Please login to your account for Up to date information</body> </html>";
     console.log("creating pdf for " + client_id);
     new wkhtmltopdf(resultHtml, { output : client_id + ".pdf" }, function (err){
         console.log("PDF for client is created");

  fs.readFile(app.config.get('cdrReoprtPdfDir')+client[i].client_name+".pdf", function (err, data) {
  mailOptions = {
    from: "Deepak kumar<uneedtomailme@gmail.com>", // sender address
    to: client[i].email, // list of receivers
    subject: "CDR REPORT", // Subject line
    text: "Hello world ", // plaintext body
    html: "<b>Hello world </b>", // html body
    attachments : [{'filename': 'cdrReport.pdf','contents':data}]
   }
  transport.sendMail(mailOptions, function(error, response){
    if(error){
        console.log(error);
    }else{
        console.log("Message sent: " + response.message);
    }
    //smtpTransport.close(); // shut down the connection pool, no more messages
   });
  }); 
});
} 
  });
   }*/
  }
 });
  },
  start: false,
  timeZone: "Asia/Calcutta"
});
job.start();

  app.log.info('Server started http://' + addr.address + ':' + addr.port);
});

