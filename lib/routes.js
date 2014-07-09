var flatiron = require('flatiron');
var paginate = require('mongoose-paginate');
var formidable = require('formidable');
var util = require('util');
var fs= require('fs');
var jsftp = require('jsftp');
var esl = require('modesl');
var socket = '';
//fs.existsSync = require('path').existsSync;

exports = module.exports = function(app, plates, passport) {

var alertMsg = '';

app.router.get('/', function () {
  app.log.info('home page');
  if (this.req.isAuthenticated()) {
    app.log.info(this.req.user.username);
    this.res.redirect('/dashboard');
  }
  else {
    this.res.writeHead(200, { 'Content-Type': 'text/html' })
    this.res.end(Views.index);
  }
});


app.router.get('/example', function () {
  app.log.info('example page');
  if (this.req.isAuthenticated()) {
    this.res.writeHead(200, { 'Content-Type': 'text/html' })
    this.res.end(Views.example);
  }
  else{
    this.res.redirect('/login');
  }
});

app.router.path('/contact', function() {
  this.get(function () {
  app.log.info('contact page');
  this.res.writeHead(200, { 'Content-Type': 'text/html' })
  this.res.end(Views.contactus);
  });
});

/*app.router.path('/login',{ stream: true }, function() {
  this.get( { stream: true },function () {
  if (this.req.isAuthenticated()) {
       this.res.redirect('/admin');
  }
  else {
       app.log.info('login page');
       this.res.writeHead(200, { 'Content-Type': 'text/html' })
       this.res.end(Views.login);
  }
  });

  //this.post(passport.authenticate('local', { successRedirect: '/admin?page=1&limit=10&username=&email=&sort=', failureRedirect: '/login'}));
  this.post(passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login'}));

});*/
app.router.get('/login', function () {
  if (this.req.isAuthenticated()) {
       this.res.redirect('/dashboard');
  }
  else {
       app.log.info('login page');
       this.res.writeHead(200, { 'Content-Type': 'text/html' })
       this.res.end(plates.bind(Views.login, {'alertMsg':alertMsg}));
       alertMsg='';
  }
  });
app.router.post('/login', passport.authenticate('local', { successRedirect: '/dashboard', failureRedirect: '/login'}));

app.router.get('/dashboard', function () {
  if (this.req.isAuthenticated()) {
      if(this.req.user.roles == 'user')
        this.res.redirect('/inbox');
      else{
       var username = this.req.user.username;
       this.res.writeHead(200, { 'Content-Type': 'text/html' })
       this.res.end(plates.bind(Views.dashboard, {'username':username, 'alertMsg':alertMsg}));
       }

  }
  else {
       app.log.info('login page');
       this.res.writeHead(200, { 'Content-Type': 'text/html' })
       this.res.end(Views.login);
  }
  });

app.router.get('/admin',{ stream: true }, function(skip,limit) {
   if(this.req.user.roles == 'user')
      this.res.redirect('/inbox');
  else{
  limit = this.req.query.limit ? parseInt(this.req.query.limit, null) : 20;
  skip = this.req.query.page ? parseInt(this.req.query.page, null) : 1;
  clientname = this.req.query.username ? this.req.query.clientname : '';
  email = this.req.query.email ? this.req.query.email : '';
  sort = this.req.query.sort ? this.req.query.sort : '_id';
  if (!limit) {
      limit = 5;
  }
  if (!skip) {
      skip = 1;
  }
  nxt = skip+1;
  prev = skip - 1;
  if(prev < 1)
    prev = 1;

  app.log.info('admin page');
  var res = this.res;
  if (this.req.isAuthenticated()) {
    var filters = {};
    var username = this.req.user.username;
    filters.username = new RegExp('^.*?'+ clientname +'.*$', 'i');
    filters.email = new RegExp('^.*?'+ email +'.*$', 'i');
    filters.roles = new RegExp('^.*?'+ 'user' +'.*$', 'i');

    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.user.find(filters,'_id username email').lean().skip((skip-1)*limit).limit(limit).sort(sort).exec(function (err, users) {
      var resultList = '';
      if(skip == 1 ){
         if(users.length !=  limit)
            page ='';
         else
            page = '<li><a href="/admin?page='+nxt+'&limit='+limit+'&username='+username+'&email='+email+'&sort='+sort+'">Next</a></li>';
       }
      else if(users.length !=  limit)
         page = '<li><a href="/admin?page='+prev+'&limit='+limit+'&username='+username+'&email='+email+'&sort='+sort+'">Previous</a></li>';
      else
         page = '<li><a href="/admin?page='+prev+'&limit='+limit+'&username='+username+'&email='+email+'&sort='+sort+'">Previous</a></li><li><a href="/admin?page='+nxt+'&limit='+limit+'&username='+username+'&email='+email+'&sort='+sort+'">Next</a></li>';
      for(var i=0;i<users.length;i++) {
        resultList += '<tr class="clickableRow" href="/admin/user/'
        + users[i]._id +'"><td style="width:22px"><label class="checkbox-inline"><input type="checkbox" name="id" value="'
        + users[i]._id+'"></label></td><td>' 
        + users[i].username + '</td><td>'
        + users[i].email + '</td></a></tr>';
      }
      res.write(plates.bind(Views.header, {'username':username}));
      res.write(plates.bind(Views.sidebar, {'alertMsg':alertMsg}));
      res.end(plates.bind(Views.admin, {'userlist':resultList, 'alertMsg':alertMsg , 'page':page,'username':username}));
      alertMsg='';
    });
  }
  else{
    console.log("user is not authenticated");
    res.redirect('/login');
  }
  }
});


app.router.get('/clientAdmin', function(skip,limit) {
 if (this.req.isAuthenticated()) {
    var username = this.req.user.username;
    if(this.req.user.accountType == 'demo')
        this.res.redirect("/demoDashboard");
    else{
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    this.res.write(plates.bind(Views.header, {'username':username}));
    this.res.write(plates.bind(Views.sidebar, {'alertMsg':alertMsg}));
    this.res.end(plates.bind(Views.clientAdmin, {'username':username}));
    }
   }
  else{
    console.log("user is not authenticated");
    this.res.redirect('/');
   }

});

app.router.get('/account_summary', function(skip,limit) {
  limit = this.req.query.limit ? parseInt(this.req.query.limit, null) : 20;
  skip = this.req.query.page ? parseInt(this.req.query.page, null) : 1;
  client_id = this.req.query.client_name ? this.req.query.client_name : '';
  //did_number = this.req.query.did_number ? this.req.query.did_number : '';
  sort = this.req.query.sort ? this.req.query.sort : '_id';
  if (!limit) {
      limit = 5;
  }
  if (!skip) {
      skip = 1;
  }
  nxt = skip+1;
  prev = skip - 1;
  if(prev < 1)
    prev = 1;

  app.log.info('did page');
  var res = this.res;
 if (this.req.isAuthenticated()) {
    var filters = {};
    var roles = this.req.user.roles;
    var username = this.req.user.username;
    var addAccount ='';
    var reallocateAccount ='';
    var client_did = '';
    if(roles == 'admin'){
      filters.client_id = new RegExp('^.*?'+ client_id +'.*$', 'i');
      addAccount = '<button  name="addClient" class="btn btn-lg btn-primary pull-right"  value="addAccount" onclick="location.href='+"'/account_summary/addAccount'"+';">Add Account</button>';
      reallocateAccount = '<button  name="reallocateAccount" class="btn btn-lg btn-primary pull-right"  value="reallocateAccount" onclick="location.href='+"'/account_summary/reallocateAccount'"+';">Reallocate Account</button>';
      }
    else{
      filters.client_id = new RegExp('^.*?'+ this.req.user.username +'.*$', 'i');
        }

    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.account_detail.find(filters,'_id client_id credit_balance total_credit pulse_rate').lean().skip((skip-1)*limit).limit(limit).sort(sort).exec(function (err, account) {
      console.log(account);
      var resultList = '';
      if(skip == 1 ){
         if(account.length !=  limit)
            page ='';
         else
            page = '<li><a href="/did?page='+nxt+'&limit='+limit+'&client_name='+client_name+'&did_number='+did_number+'&sort='+sort+'">Next</a></li>';
       }
      else if(account.length !=  limit)
         page = '<li><a href="/did?page='+prev+'&limit='+limit+'&client_name='+client_name+'&did_number='+did_number+'&sort='+sort+'">Previous</a></li>';
      else
         page = '<li><a href="/did?page='+prev+'&limit='+limit+'&client_name='+client_name+'&did_number='+did_number+'&sort='+sort+'">Previous</a></li><li><a href="/did?page='+nxt+'&limit='+limit+'&client_name='+client_name+'&did_number='+did_number+'&sort='+sort+'">Next</a></li>';
      for(var i=0;i<account.length;i++) {
        client_did = account[i].client_id.split(":");        
        console.log(account);
         if(roles == 'admin'){
           resultList += '<tr class="clickableRow" href="/account_summary/editAccount/'+ account[i]._id +'"><td style="width:22px"><label class="checkbox-inline"><input type="checkbox" name="id" value="';
           }
         else{
          resultList += '<tr><td style="width:22px"><label class="checkbox-inline"><input type="checkbox" name="id" value="';
           }
        resultList += account[i]._id+'"></label></td><td>' 
        + client_did[0] + '</td><td>'
        + client_did[1] + '</td><td>'
        + account[i].total_credit + '</td><td>'
        + account[i].credit_balance + '</td><td>'
        + account[i].pulse_rate + '</td></a></tr>';
      }
      res.write(plates.bind(Views.header, {'username':username}));
      res.write(plates.bind(Views.sidebar, {'alertMsg':alertMsg}));
      res.end(plates.bind(Views.accountSummary, {'accountSummary':resultList,'username': username, 'addAccount':addAccount ,'reallocateAccount':reallocateAccount, 'alertMsg':alertMsg , 'page':page}));
    });
   }
  else{
    console.log("user is not authenticated");
    this.res.redirect('/');
   }
});

app.router.path('/account_summary/addAccount', function() {
  this.get(function() {
  var res = this.res;
  if (this.req.isAuthenticated() && this.req.user.roles == 'admin') {
    var filters = {};
    var filters_did = {};
    var username = this.req.user.username;
    var resultList ='';
    var didList ='';
    filters.roles= new RegExp('^.*?'+ 'user' +'.*$', 'i');
    filters_did.client_name= new RegExp('^.*?'+ 'client_flexydial' +'.*$', 'i');
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.user.find(filters,'username').lean().exec(function (err, client) {
     console.log(client);
     for(var i=0;i<client.length;i++) {
     //console.log(client[i].username);
        if(i==0)
             resultList += '<option value =""></option>';
        resultList += '<option value ="'+client[i].username+'">'+client[i].username+'</option>';
      }
     app.db.models.did.find(filters_did,'did_number').lean().exec(function (err, did) {
     console.log(did);
     for(var i=0;i<did.length;i++) {
        didList += '<option value ="'+did[i].did_number+'">'+did[i].did_number+'</option>';
        console.log(didList);
      }
      res.write(plates.bind(Views.header, {'username':username}));
      res.write(plates.bind(Views.sidebar, {'alertMsg':alertMsg}));
     res.end(plates.bind(Views.addAccount, {'client_name': resultList ,'did_number': didList, 'alertMsg': alertMsg,'username':username}));
     alertMsg='';
     });
    });
  }
  else{
    console.log("user is not authenticated");
    this.res.redirect('/');
  }
  });

  this.post(function() {
  var req = this.req;
  var res = this.res;
  var client_id = req.body.client_name+":"+req.body.did_number;
  var ip_address = req.body.ip_address;
  var total_credit = req.body.tot_credit;
  var pulse_rate = req.body.pulse;
  var account_validity = req.body.account_validity;
   console.log(client_id+total_credit+pulse_rate);
  if (this.req.isAuthenticated()) {
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
         app.db.models.account_detail.find({client_id: client_id},'_id').lean().exec(function (err, accountobj) {
          if(!err && accountobj.length==0){

          var socket = app.io_client.connect('http://'+ip_address+':' + app.config.get('syncPort'), {'force new connection': true});
                                           // Add a connect listener
          socket.emit('add account',{"client_id" : client_id, "total_credit" : total_credit, "credit_balance" : total_credit, 'pulse_rate': pulse_rate, 'account_validity': account_validity});
              socket.on('connect', function(socket) {
                 console.log('NMS Client Connected!');
              });
              socket.on('account added', function (data) {
                 app.db.models.account_detail.create({"client_id" : client_id, "total_credit" : total_credit, "credit_balance" : total_credit, 'pulse_rate': pulse_rate , 'account_validity' : account_validity}, function (err, userobj) {
                    if(!err){
                        console.log(userobj);
                        alertMsg='<div class="alert alert-success"><strong>Success !</strong> New Account:'+client_id+' is added.</div>';
                        res.redirect('/account_summary');
                        }
                    else{
                        console.log(err);
                        alertMsg='<div class="alert alert-danger"><strong>'+client_id+'</strong> Account is already present, please choose another .</div>';
                        res.redirect('/account_summary/addAccount');
                        }
                      });
                  });
            }
           else{
              console.log(err);
              alertMsg='<div class="alert alert-danger"><strong>'+client_id+'</strong> Account is already present, please choose another .</div>';
              res.redirect('/account_summary/addAccount');
              }
          });
       }
  else{
    console.log("user is not authenticated");
    res.redirect('/');
   }
 });
});

app.router.path('/account_summary/reallocateAccount', function() {
  this.get(function() {
  var res = this.res;
  if (this.req.isAuthenticated() && this.req.user.roles == 'admin') {
    var filters = {};
    var username = this.req.user.username;
    var resultList ='';
    var didList ='';
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.account_detail.find(filters,'client_id credit_balance').lean().exec(function (err, account) {
     console.log(account);
     for(var i=0;i<account.length;i++) {
     //console.log(client[i].username);
        if(i==0)
             resultList += '<option value =""></option>';
        resultList += '<option value ="'+account[i].client_id+'">'+account[i].client_id+"- Balance Amount :"+account[i].credit_balance+'</option>';
      }
      res.write(plates.bind(Views.header, {'username':username}));
      res.write(plates.bind(Views.sidebar, {'alertMsg':alertMsg}));
     res.end(plates.bind(Views.reallocateAccount, {'from_account': resultList ,'to_account': resultList, 'alertMsg': alertMsg,'username':username}));
     alertMsg='';
     });
  }
  else{
    console.log("user is not authenticated");
    this.res.redirect('/');
  }
  });

  this.post(function() {
  var req = this.req;
  var res = this.res;
  var from_account = req.body.from_account;
  var to_account = req.body.to_account;
  var trans_amount = req.body.trans_amount;
   console.log(from_account + to_account + trans_amount);
   var did_number = from_account.split(":")[1];
     did_number = did_number.split("-")[0];
  console.log(did_number);
  if (this.req.isAuthenticated()) {
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
         app.db.models.did.find({did_number: did_number},'ip_address').lean().exec(function (err, accountobj) {
          console.log(accountobj);
          if(!err){
          app.db.models.account_detail.find({client_id:from_account},'credit_balance').lean().exec(function (err, from_credit_balance) {
            if(!err){
            var from_amnt = parseInt(from_credit_balance[0].credit_balance)-parseInt(trans_amount);
            console.log(from_amnt); 
             app.db.models.account_detail.find({client_id:to_account},'credit_balance').lean().exec(function (err, to_credit_balance) {
               if(!err){
                 var to_amnt = parseInt(to_credit_balance[0].credit_balance)+parseInt(trans_amount);
                 console.log(to_amnt); 
     // supposing that both the did's are in same flexydial server ie on same ip 
          var socket = app.io_client.connect('http://'+accountobj[0].ip_address+':' + app.config.get('syncPort'), {'force new connection': true});
                                           // Add a connect listener
          socket.emit('reallocate account',{"from_account" : from_account, "to_account" : to_account, "from_amnt" : from_amnt, "to_amnt": to_amnt});
              socket.on('connect', function(socket) {
                 console.log('NMS Client Connected!');
                    app.db.models.account_detail.update({client_id: from_account}, {$set: {credit_balance: from_amnt}}, {upsert: true}).exec(function (err, userobj) {
                    if(!err){
                        app.db.models.account_detail.update({client_id: to_account}, {$set: {credit_balance: to_amnt}}, {upsert: true}).exec(function (err, userobj) {
                        if(!err){
                        console.log(userobj);
                        alertMsg='<div class="alert alert-success"><strong>Success !</strong> Reallocated.</div>';
                        res.redirect('/account_summary');
                        }
                        });
                        }
                    else{
                        console.log(err);
                        alertMsg='<div class="alert alert-danger"><strong>'+client_id+'</strong> Account is already present, please choose another .</div>';
                        res.redirect('/account_summary');
                        }
                      });
                  });
              socket.on('error', function (reason){
              console.error('Unable to connect Socket.IO', reason);
              alertMsg='<div class="alert alert-danger"><strong>Unable to connect with Server !</strong> Please try after some time  .</div>';
              res.redirect('/account_summary');
              });
              socket.on('disconnect', function (reason){
              //socket.destroy();
              console.error('Unable to connect Socket.IO', reason);
              alertMsg='<div class="alert alert-danger"><strong>Unable to connect with Server !</strong> Please try after some time  .</div>';
              res.redirect('/account_summary');
               });
              }
             });
               }
              });
             }
            });
            }
           else{
              alertMsg='<div class="alert alert-danger"><strong>'+client_id+'</strong> Account is already present, please choose another .</div>';
                }
              });
   });

app.router.path('/virtualReceptionist', function() {
  this.get(function() {
  var res = this.res;
  if (this.req.isAuthenticated()) {
    var filters = {};
    var addDidforVr = '<button  name="addClient" class="btn btn-lg btn-primary pull-right"  value="allocateDidforVR" onclick="location.href='+"'/allocateDidForVR'"+';">Add Did For VR</button><h3>Virtual Receptionist</h3>';

    var username = this.req.user.username;
    var didList ='';
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
     if(this.req.user.roles != 'admin')
     {
      filters.client_name = new RegExp('^.*?'+ this.req.user.username +'.*$', 'i');
      addDidforVr = '<h3>Virtual Receptionist</h3>';
     }
    app.db.models.did.find(filters,'did_number').lean().exec(function (err, did) {
      console.log(did);
      for(var i=0;i<did.length;i++) {
        if(i==0)
             didList += '<option value =""></option>';
         didList += '<option value ="'+did[i].did_number+'">'+did[i].did_number+'</option>';
         console.log(didList);
       }
      res.write(plates.bind(Views.header, {'username':username}));
      res.write(plates.bind(Views.sidebar, {'alertMsg':alertMsg}));
     res.end(plates.bind(Views.superReceptionist, {'didList': didList, 'alertMsg': alertMsg,'username':username, 'addDidforVr': addDidforVr}));
     alertMsg='';
     });
  }
  else{
    console.log("user is not authenticated");
    this.res.redirect('/');
  }
  });

   });

app.router.get('/extension', function(skip,limit) {
  
 if (this.req.isAuthenticated()) {
    limit = this.req.query.limit ? parseInt(this.req.query.limit, null) : 20;
    skip = this.req.query.page ? parseInt(this.req.query.page, null) : 1;
    extension = this.req.query.client_name ? this.req.query.client_name : '';
    did_number = this.req.query.did_number ? this.req.query.did_number : '';
    sort = this.req.query.sort ? this.req.query.sort : '_id';
    client_phone = '';
    if (!limit) {
      limit = 5;
    }
    if (!skip) {
      skip = 1;
    }
    nxt = skip+1;
    prev = skip - 1;
    if(prev < 1)
    prev = 1;

  app.log.info('superReceptionist page');
  var res = this.res;
 
    var filters = {};
    var filters_did = {};
    var username = this.req.user.username;
    var roles = this.req.user.roles;
    var addDid = '';
    addExtension = '<button  name="addExtension" class="btn btn-lg btn-primary pull-right"  value="addDid" onclick="location.href='
                    +"'/did/superReceptionist'"+';">Add Extension</button>';
      
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    if(roles != 'admin'){
    var dids = [];
         filters_did.client_name = username;
         app.db.models.did.find(filters_did,'did_number').lean().exec(function (err, exten) {
              console.log("exten:  "+ JSON.stringify(exten))
               if(!err){
                 for(var i = 0 ; i<exten.length ; i++){
                     if(did_number != '' && did_number === exten[i].did_number){
                       dids.push(did_number);
                       break;
                     }   
                     else
                       dids.push(exten[i].did_number);
                 }

             app.db.models.extension.find({did: {$in: dids}}).lean().skip((skip-1)*limit).limit(limit).sort(sort).exec(function (err, exten) {
      var resultList = '';
      if(skip == 1 ){
         if(exten.length !=  limit)
            page ='';
         else
            page = '<li><a href="/extension?page='+nxt+'&limit='+limit+'&extension='+extension+'&did_number='+did_number+'&sort='+sort+'">Next</a></li>';
       }
      else if(exten.length !=  limit)
         page = '<li><a href="/extension?page='+prev+'&limit='+limit+'&extension='+extension+'&did_number='+did_number+'&sort='+sort+'">Previous</a></li>';
      else
         page = '<li><a href="/extension?page='+prev+'&limit='+limit+'&extension='+extension+'&did_number='+did_number+'&sort='+sort+'">Previous</a></li><li><a href="/extension?page='+nxt+'&limit='+limit+'&extension='+extension+'&did_number='+did_number+'&sort='+sort+'">Next</a></li>';
      for(var i=0;i<exten.length;i++)
      { 
        resultList += '<tr class="clickableRow" href="/extension/edit/'
                         + exten[i]._id  +' "><td style="width:22px"><label class="checkbox-inline"><input type="checkbox" name="_id" value="';
        resultList +=
          exten[i]._id+'"></label></td><td>'
        + exten[i].did + '</td><td>'
        + exten[i].extension + '</td><td>'
        + exten[i].number + '</td><td>'
        + exten[i].region + '</td></tr>';
      }

      res.write(plates.bind(Views.header, {'username':username}));
      res.write(plates.bind(Views.sidebar, {'alertMsg':alertMsg}));
      res.end(plates.bind(Views.superReceptionistList, {'didlist':resultList, 'alertMsg':alertMsg , 'page':page,'username':username, 'addExtension_btn': addExtension}));
      alertMsg='';
    });

               } 
         });
    }
    else{
    filters.did = new RegExp('^.*?'+ did_number +'.*$', 'i');
    app.db.models.extension.find(filters).lean().skip((skip-1)*limit).limit(limit).sort(sort).exec(function (err, exten) {
      console.log('extension' + exten.length);
      var resultList = '';
      if(skip == 1 ){
         if(exten.length !=  limit)
            page ='';
         else
            page = '<li><a href="/extension?page='+nxt+'&limit='+limit+'&extension='+extension+'&did_number='+did_number+'&sort='+sort+'">Next</a></li>';
       }
      else if(exten.length !=  limit)
         page = '<li><a href="/extension?page='+prev+'&limit='+limit+'&extension='+extension+'&did_number='+did_number+'&sort='+sort+'">Previous</a></li>';
      else
         page = '<li><a href="/extension?page='+prev+'&limit='+limit+'&extension='+extension+'&did_number='+did_number+'&sort='+sort+'">Previous</a></li><li><a href="/extension?page='+nxt+'&limit='+limit+'&extension='+extension+'&did_number='+did_number+'&sort='+sort+'">Next</a></li>';
      for(var i=0;i<exten.length;i++)
      {        
        resultList += '<tr class="clickableRow" href="/extension/edit/'
                         + exten[i]._id  +' "><td style="width:22px"><label class="checkbox-inline"><input type="checkbox" name="_id" value="';
        resultList +=
          exten[i]._id+'"></label></td><td>' 
        + exten[i].did + '</td><td>'
        + exten[i].extension + '</td><td>'
        + exten[i].number + '</td></a></tr>';
      }
 
      res.write(plates.bind(Views.header, {'username':username}));
      res.write(plates.bind(Views.sidebar, {'alertMsg':alertMsg}));
      res.end(plates.bind(Views.superReceptionistList, {'didlist':resultList, 'alertMsg':alertMsg , 'page':page,'username':username, 'addExtension_btn': addExtension}));
      alertMsg='';
    });
  }
  }
  else{
    console.log("user is not authenticated");
    this.res.redirect('/login');
  }
});


app.router.path('/extension/add', function(did_id) {
  this.get(function(did_id) {
    var res = this.res;
  if (this.req.isAuthenticated()) {
    var filters = {};


    var username = this.req.user.username;
    var didList ='';
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
     if(this.req.user.roles != 'admin')
     {
      filters.client_name = new RegExp('^.*?'+ this.req.user.username +'.*$', 'i');
       addDidforVr = '<h3>Add Extensions </h3>';
     }
    app.db.models.did.find(filters,'did_number').lean().exec(function (err, did) {
      console.log(did);
      for(var i=0;i<did.length;i++) {
        if(i==0)
             didList += '<option value =""></option>';
         didList += '<option value ="'+did[i].did_number+'">'+did[i].did_number+'</option>';
         console.log(didList);
       }
      res.write(plates.bind(Views.header, {'username':username}));
      res.write(plates.bind(Views.sidebar, {'alertMsg':alertMsg}));
     res.end(plates.bind(Views.addExtension, {'didList': didList, 'alertMsg': alertMsg,'username':username, 'addDidforVr' : addDidforVr}));
     alertMsg='';
     });
  }
  else{
    console.log("user is not authenticated");
    this.res.redirect('/');
  }

  });
});

app.router.post('/getExtension', function() {
  if (this.req.isAuthenticated()) {
     console.log("NMS");
    var did = this.req.body.did_number;
    var res = this.res;
    var filters_did = {};
    var extensionList ='';
    filters_did.did= did;
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.extension.find(filters_did,'did extension number').lean().exec(function (err, extension) {
     if(extension.length >0){
     for(var i=0;i<extension.length;i++) {
             extensionList += '<tr><td>'+extension[0].extension+'</td><td>'+extension[0].number+'</td></tr>';
      }
     res.write(extensionList);
     res.end();
     }
     });
     }
});

app.router.post('/extension/add', function() {
  if (this.req.isAuthenticated()) {
     console.log("NMS");
    var ext = "'extension1'";
    var num = 'number';
    var dd  = this.req.body['did_number'];
    var res = this.res;

    var fields = [];
  var form = new formidable.IncomingForm();
 form
     .on('field', function(field, value) {
       console.log(field, value);
       fields.push([field, value]);
     })
 .on('end', function() {
 console.log(fields[2][0])
 console.log(fields[2][1])
 console.log(fields[2][2])
 console.log(fields[2][3])
 
 });
    var filters_did = {};
    var extensionList ='';
    filters_did.did= did;
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    /*app.db.models.extension.find(filters_did,'did extension number').lean().exec(function (err, extension) {
     if(extension.length >0){
     for(var i=0;i<extension.length;i++) {
             extensionList += '<tr><td>'+extension[0].extension+'</td><td>'+extension[0].number+'</td></tr>';
      }
     res.write(extensionList);
     res.end();
     }
     });*/
     }
});



app.router.path('/extension/edit/:exten_id', function(exten_id) {
  this.get(function(exten_id) {
  var res = this.res;
  if (this.req.isAuthenticated() && this.req.user.roles == 'admin') {
    var roles = this.req.user.roles;
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.extension.find( { _id : exten_id }).lean().exec(function (err, extenobj) {
    //console.log(extenobj);
    var did_number = "<input type='text' class='form-control' name='did' value='"+extenobj[0].did+"' readonly='' >";
    var extension = "<input type='text' class='form-control' name='extension' value='"+extenobj[0].extension+"' >";
    var number = "<input type='text' class='form-control' name='phone' value='"+extenobj[0].number+"'>";
    var id = "<input type='hidden' name='_id' value='"+extenobj[0]._id+"'</input>";
    res.end(plates.bind(Views.editExtension, { '_id': id, 'did':did_number,'extension':extension, 'phone':number,'alertMsg':alertMsg}));
    alertMsg='';
    });
  }
  else{
    console.log("user is not authenticated");
    res.redirect('/');
   }
  });
});


app.router.post('/extension/saveExtension', function() {
  var res = this.res;
  var req = this.req;
  var did = req.body.did;
  var extension = req.body.extension;
  var phone = req.body.phone;
  var id = this.req.body._id;
  if (this.req.isAuthenticated() && this.req.user.roles == 'admin' ) {
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.did.find( {did_number : did }, ('ip_address')).exec(function (err, didobj) {
	    if (!err)
	    {  
	      var ip_address = didobj[0].ip_address;
		  app.db.models.extension.update( {_id: id}, {$set: { extension: extension, number : phone }}, {upsert: true}).exec(function (err, userobj) {
		  if(!err){
		       var socket = app.io_client.connect('http://'+ip_address+':' + app.config.get('syncPort'), {'force new connection': true});
							// Add a connect listener
						       socket.on('connect', function(socket) {
							    console.log('NMS Client Connected!');
							    });
						       
							    socket.emit('edit extension',{_id: id , did : did, extension: extension, number : phone });    
							    socket.on('extension edited', function (data) {
							      alertMsg = '<div class="alert alert-success"><strong>Success ! </strong> Extension information changed.</div>';
							      var redirectUrl = "/extension";
							      res.redirect(redirectUrl);
							    });
							    socket.on('extension not edited', function (data) {
							      alertMsg = '<div class="alert alert-success"><strong>Inconsistent Database! </strong> Extension information not updated on remote server.</div>';
							      var redirectUrl = "/extension";
							      res.redirect(redirectUrl);
							    });
							
		    
		  }
		  }); 
	    }
	    else
	    {
	      console.log(err);
	    }
     });
  }
  else{
    console.log("user is not authenticated");
    res.redirect('/');
  }
 });

app.router.post('/extension/deleteExtension', function() {
  var ids= [];
  console.log(this.req.body);
  if(this.req.body._id){
    if( typeof this.req.body._id == 'string')
      ids.push(this.req.body._id);
    else
      ids = this.req.body._id;
    console.log(ids);
    app.db.models.extension.find({_id:{ $in:ids}}).remove().exec(function (err, userobj) {
      console.log(userobj);
       if(!err) {
          alertMsg='<div class="alert alert-danger"><strong>Success !!</strong> Extension/s is deleted successfully .</div>';
       }
       else{
          console.log(err);
          alertMsg='<div class="alert alert-danger"><strong>Faliure.. !!</strong>'+JSON.stringify(err)+'</div>';
       }

    });
  }
  else{
      alertMsg='<div class="alert alert-danger"><strong>No Item </strong> is selected</div>';
  }
  this.res.redirect('/extension?page=1&limit=10&did=&extension=&sort=');
});




app.router.path('/account_summary/editAccount/:account_id', function(account_id) {
  this.get(function(account_id) {
  var res = this.res;
  var username = this.req.user.username;
  if (this.req.isAuthenticated() && (this.req.user.roles == 'admin')) {
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.account_detail.find({_id:account_id}).lean().exec(function (err, accountobj) {
    var client = "<input type='text' class='form-control'name='client_name' value='"+accountobj[0].client_id+"' readonly='' >";
    var total_credit = "<input type='text' class='form-control'name='total_credit' value='"+accountobj[0].total_credit+"' >";
    var credit_balance = "<input type=text class='form-control' id='credit_balance' name='credit_balance' value='"+accountobj[0].credit_balance+"'>";
    var pulse_rate = "<input type='text' class='form-control'name='pulse_rate' value='"+accountobj[0].pulse_rate+"' >";
    var id = "<input type=hidden name='id' id='uid' value='"+accountobj[0]._id+"'</input>";
    res.end(plates.bind(Views.editAccount, {'client_name':client,'total_credit': total_credit, 'credit_balance': credit_balance,'pulse_rate' : pulse_rate, '_id':id, 'alertMsg':alertMsg, 'username' : username }));
    alertMsg='';
    });
  }
  else{
    console.log("user is not authenticated");
    res.redirect('/');
   }
  });
});


app.router.post('/did/getDid', function() {
  if (this.req.isAuthenticated()) {
    var client_name = this.req.body.client_name;
    var res = this.res;
    var filters_did = {};
    var didList ='';
    filters_did.client_name= new RegExp('^.*?'+ client_name +'.*$', 'i');
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.did.find(filters_did,'did_number ip_address').lean().exec(function (err, did) {
     console.log(did);
     for(var i=0;i<did.length;i++) {
        if(i==0)
             didList += '<option value =""></option>';
        didList += '<option value ="'+did[i].did_number+'">'+did[i].did_number+'->'+did[i].ip_address+'</option>';
        console.log(didList);
      }
    res.write(didList);
    res.end();
   });
}
});

app.router.post('/importAddress', function() {
  if (this.req.isAuthenticated()) {
    var res = this.res;
    contacts = this.req.body.contacts;
    var username = this.req.user.username;
    //var address_book = [];
    contacts = JSON.parse(contacts);
    var list_name = this.req.body.list_name;
    console.log(list_name);
    for(i=1;i<contacts.length;i++){
       /*address_book[i].client_id = username;
       address_book[i].name = contacts[i][0];
       address_book[i].phone_number = contacts[i][2];
       address_book[i].email = contacts[i][3];
    }*/
       res.writeHead(200, { 'Content-Type': 'text/html' });
       app.db.models.addressBook.create({"client_id" : username, "name": contacts[i][0], "email" : contacts[i][3],"phone_number" : contacts[i][2], "list_name": list_name }, function (err, userobj) {
   //    app.db.models.addressBook.create(address_book , function (err, userobj) {
       if(!err){
          if(i === contacts.length-1){
          res.write("DONE");
          res.end();}
          }
       else{
          res.write("NOT DONE");
          res.end();
        }
       });
     }
    /*var contacts = this.req.body.dataString;
    console.log(contacts);
    parsedData = JSON.parse(contacts);
    console.log(parsedData.length);
    for(i=0;i< parsedData.length; i++)
       console.log(parsedData[i]);*/
}
});
app.router.post('/addContact', function(){
  if (this.req.isAuthenticated()) {
  var req = this.req;
  var res = this.res;
  var list_name = req.body.list_name;
  var username = req.user.username;
  var name = req.body.name;
  console.log(req);
  var email = req.body.email;
  var phone_number = req.body.phone_number;
  var company = req.body.company;
  console.log(username+name+email+phone_number+company + list_name); 
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.addressBook.create({"client_id" : username, "name": name, "email" : email,"phone_number" : phone_number, "company" : company, "list_name" : list_name }, function (err, userobj) {
       if(!err){
          res.write("DONE");
          res.end();
          }
       else{
          res.write("NOT DONE");
          res.end();
        }
    });
   }
  else{
    console.log("user is not authenticated");
    res.redirect('/');
   }
  });
app.router.post('/createList', function() {
  if (this.req.isAuthenticated()) {
    var username = this.req.user.username;
    var list_name = this.req.body.list_name;
    var res = this.res;
    var listResult ='';
    var filters_list ={};
    app.db.models.listAddressBook.create({"client_id" : username, "list_name": list_name}, function (err, userobj) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
       if(!err){
          listResult +='<tr><td><div>All</div></td><td>download</td></tr>';
          filters_list.client_id = new RegExp('^.*?'+ username +'.*$', 'i');
          res.write("DONE:");
          app.db.models.listAddressBook.find(filters_list).lean().exec(function (err,  list) {
          console.log(list);
          if(!err){
          for(var i=0;i<list.length;i++) {
             listResult +='<tr><td>'+list[i].list_name+'</td><td>download</td></tr>';
            }
          }
          res.write(listResult);
          res.end();
          });
          }
       else{
          res.write("NOT DONE");
          res.end();
      }
   });
  }
});

app.router.post('/getContacts', function() {
  if (this.req.isAuthenticated()) {
   limit = this.req.body.limit ? parseInt(this.req.body.limit, null) : 10;
   skip = this.req.body.skip ? parseInt(this.req.body.skip, null) : 1;
   sort = this.req.query.sort ? this.req.query.sort : '-_id';
  console.log(limit+ ":" + skip);
   nxt = skip+1;
   prev = skip - 1;
   if(prev < 1)
     prev = 1;

    var username = this.req.user.username;
    var list_name = this.req.body.list_name;
    console.log(list_name);
    var res = this.res;
    var listResult ='';
    var filters_list ={};
    res.writeHead(200, { 'Content-Type': 'text/html' });
    if(this.req.user.roles != 'admin')
      filters_list.client_id = new RegExp('^.*?'+ username +'.*$', 'i');
    if(list_name != 'all')
      filters_list.list_name = new RegExp('^.*?'+ list_name +'.*$', 'i');
          res.write("DONE:");
          app.db.models.addressBook.find(filters_list).lean().skip((skip-1)*limit).limit(limit).sort(sort).exec(function (err,  list) {
          //console.log(list);
          if(!err){
     if(skip == 1 ){
         if(list.length !=  limit)
            page ='';
         else
            page = '<li><a href="#" onclick="getContactsOfList(\''+list_name+'\',\''+nxt+'\',\''+limit+'\')">Next</a></li>';
       }
      else if(list.length !=  limit)
         page = '<li><a href="#" onclick="getContactsOfList(\''+list_name+'\',\''+prev+'\',\''+limit+'\')">Previous</a></li>';
      else
         page = '<li><a href="#" onclick="getContactsOfList(\''+list_name+'\',\''+prev+'\',\''+limit+'\')">Previous</a></li><li><a href="#" onclick="getContactsOfList(\''+list_name+'\',\''+nxt+'\',\''+limit+'\')">Next</a></li>';

          for(var i=0;i<list.length;i++) {
             listResult +='<tr><td>'+list[i].name+'</td><td>'+list[i].phone_number+'</td><td>'+list[i].email+'</td></tr>';
            }
           listResult += ":"+page;
          }
          res.write(listResult);
          res.end();
          });
  }
});

app.router.post('/getBalance', function() {
  if (this.req.isAuthenticated()) {
    var username = this.req.user.username;
    var filters_list = {};
    var res = this.res;
    var balance = 0;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    if(this.req.user.roles != 'admin')
      filters_list.client_id = new RegExp('^.*?'+ username +'.*$', 'i');
    app.db.models.account_detail.find(filters_list).lean().exec(function (err, accntobj) {
       if(!err && accntobj.length>0){
        for(var i =0 ; i<accntobj.length;i++)
            balance = balance + accntobj[i].credit_balance;
        res.write(balance.toString());
       }
       else
          res.write("NOT DONE");
       res.end();
   });
 }
});

app.router.post('/getDowloadList', function() {
  if (this.req.isAuthenticated()) {
   limit = this.req.query.limit ? parseInt(this.req.query.limit, null) : 100;
   skip = this.req.query.page ? parseInt(this.req.query.page, null) : 1;
   sort = this.req.query.sort ? this.req.query.sort : '-_id';

   nxt = skip+1;
   prev = skip - 1;
   if(prev < 1)
     prev = 1;

    var username = this.req.user.username;
    var list_name = this.req.body.list_name;
    console.log(list_name);
    var res = this.res;
    var listResult ='';
    var filters_list ={};
    res.writeHead(200, { 'Content-Type': 'text/html' });
    if(this.req.user.roles != 'admin')
      filters_list.client_id = new RegExp('^.*?'+ username +'.*$', 'i');
    if(list_name != 'all')
      filters_list.list_name = new RegExp('^.*?'+ list_name +'.*$', 'i');
          app.db.models.addressBook.find(filters_list).lean().skip((skip-1)*limit).limit(limit).sort(sort).exec(function (err,  list) {
          //console.log(list);
          if(!err)
            res.write(JSON.stringify(list));
          else
            res.write("NOT DONE");
          res.end();
          });
  }
});


app.router.post('/account_summary/saveAccount', function() {
  console.log("Account is saved");
  var res = this.res;
  var total_credit = this.req.body.total_credit;
  var credit_balance = this.req.body.credit_balance;
  var pulse_rate = this.req.body.pulse_rate;
  var id = this.req.body.id;
  console.log(total_credit +credit_balance +  id);
  if(this.req.isAuthenticated()) {
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.account_detail.update({_id: id}, {$set: {total_credit:total_credit, credit_balance: credit_balance, pulse_rate: pulse_rate}}, {upsert: true}).exec(function (err, userobj) {
    if(!err){
        alertMsg = '<div class="alert alert-success"><strong>Success ! </strong> User information changed.</div>';
        var redirectUrl = "/account_summary/editAccount/"+id;
        res.redirect(redirectUrl);
    }
    });
  }
  else{
    console.log("user is not authenticated");
    res.redirect('/');
  }
 });

app.router.path('/admin/addUser', function() {
  this.get(function() {
  if (this.req.isAuthenticated()) {
    var username = this.req.user.username;
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    this.res.write(plates.bind(Views.header, {'username':username}));
    this.res.write(plates.bind(Views.sidebar, {'alertMsg':alertMsg}));
    this.res.end(plates.bind(Views.addUser, {'alertMsg':alertMsg,'username':username}));
    alertMsg='';
  }
  else{
    console.log("user is not authenticated");
    this.res.redirect('/');
  }
  });

  this.post(function() {
  console.log("user is added");
  var req = this.req;
  var res = this.res;
  var username = req.body.username;
  var address = req.body.address;
  var email = req.body.email;
  var mobile = req.body.mobile;
  var pwd = req.body.pwd;
  var role = req.body.role;
  var encryptedPassword = app.db.models.user.encryptPassword(pwd);
  console.log(encryptedPassword);
  if (this.req.isAuthenticated()) {
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.user.create({"username" : username, "address": address, "email" : email,"mobile" : mobile, "isActive" : false, "password" : encryptedPassword, "roles" : role}, function (err, userobj) {
       if(!err){
          console.log(userobj);
          var url = "http://localhost:9090/activateMyAccount/"+userobj["_id"];
         console.log(url);
          mailOptions = {
                  from: "Deepak kumar<uneedtomailme@gmail.com>", // sender address
                  to: email, // list of receivers
                  subject: "Get Your Account Activated !!", // Subject line
                  text: "WELCOME...", // plaintext body
                  html: "<b><h1>Thankyou for the registeration !</h1></b><br><b>Please Click on the link given below to activate your account.</b><br><a href='"+url+"'>Get Your Account Activated</a><br>Username:"+username+"<br>Password:"+pwd // html body
                 }
         app.transport.sendMail(mailOptions, function(error, response){
           if(error){
                 console.log(error);
           }else{
              console.log("Message sent: " + response.message);
          alertMsg='<div class="alert alert-success"><strong>Success !</strong> New user:'+username+' is added.</div>';
          res.redirect('/admin');
           }
         });
       }
       else{
          console.log(err);
          alertMsg='<div class="alert alert-danger"><strong>'+username+'</strong> Username is already present, please choose another .</div>';
          res.redirect('/admin/addUser');
       }
    });
   }
  else{
    console.log("user is not authenticated");
    res.redirect('/');
   }
 });
});


app.router.path('/admin/user/:userid', function(userid) {
  this.get(function(userid) {
  var res = this.res;
  if (this.req.isAuthenticated()) {
    var username = this.req.user.username;
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.user.find({_id:userid}).lean().exec(function (err, userobj) {
    var user = "<input type='text' class='form-control'name='username' value='"+userobj[0].username+"' readonly='true'>";
    var email = "<input type=text class='form-control' id='em' name='email' value='"+userobj[0].email+"'>";
    var id = "<input type=hidden name='id' id='uid' value='"+userobj[0]._id+"'</input>";
    res.end(plates.bind(Views.user, {'userName':user, 'eml':email, '_id':id, 'alertMsg':alertMsg,'username':username}));
    alertMsg='';
    });
   }
  else{
    console.log("user is not authenticated");
    res.redirect('/');
   }
  });
});

app.router.post('/admin/saveUser', function() {
  console.log("user is saved");
  var res = this.res;
  var username = this.req.body.username;
  var emails = this.req.body.email;
  var id = this.req.body.id;
  if (this.req.isAuthenticated()) {
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.user.update({_id: id}, {$set: {email:emails}}, {upsert: true}).exec(function (err, userobj) {
    if(!err){
        alertMsg = '<div class="alert alert-success"><strong>Success ! </strong> User information changed.</div>';
        var redirectUrl = "/admin/user/"+id;
        res.redirect(redirectUrl);
    }
    });
  }
  else{
    console.log("user is not authenticated");
    res.redirect('/');
  }
});

app.router.path('/activateMyAccount/:userid', function(userid) {
  this.get(function(userid) {
  var res = this.res;
  app.db.models.user.find({_id: userid}).lean().exec(function (err, user) {
  if(user[0].accountType === 'demo'){
  var username = user[0].username;
  var phone_number = user[0].mobile;
  var ip_address = app.config.get('ip_for_demo_ivr');
  app.db.models.user.update({_id: userid}, {$set: {isActive:true}}, {upsert: true}).exec(function (err, userobj) {
    app.db.models.did.find({client_name : ""},'did_number').lean().limit(1).exec(function (err, did) {
    if(!err && did.length > 0){
    did_number = did[0].did_number;
    var socket = app.io_client.connect('http://'+app.config.get('ip_for_demo_ivr')+':' + app.config.get('syncPort'), {'force new connection': true});
    var client_id = username +":"+did_number ;                                // Add a connect listener
    socket.emit('add account',{"client_id" : client_id, "total_credit" : 5, "credit_balance" : 5, 'pulse_rate': 60});
    socket.on('connect', function(socket) {
       console.log('NMS Client Connected!');
    });
    socket.on('account added', function (data) {
       app.db.models.account_detail.create({"client_id" : client_id, "total_credit" : 5, "credit_balance" : 5, 'pulse_rate': 60}, function (err, userobj) {
       if(!err){
           console.log(userobj);
           app.db.models.did.update({did_number : did_number},{$set : {client_name : username, "ip_address" : ip_address, "ftp_username" : app.config.get('ftp_username_demo_ivr') , "ftp_password" : app.config.get('ftp_pwd_demo_ivr') }} , function (err, clientobj) {

   app.db.models.extension.create({"did" : did_number, "extension" : '1', "number" : phone_number}, function (err, extenobj) {
              if(!err)
                  {
                  var socket = app.io_client.connect('http://'+ip_address+':' + app.config.get('syncPort'), {'force new connection': true});
                  // Add a connect listener
                  socket.on('connect', function(socket) {
                      console.log('Connected to remote host');
                      });
                  socket.emit('add extension',{_id: extenobj._id , did : did_number, extension: '1' , number : phone_number });   
                  socket.on('extension added', function (data) {
                    //alertMsg = '<div class="alert alert-success"><strong>Success ! </strong> Extension information changed.</div>';
                    console.log('One extension is updated on remote database');
                  });
                  socket.on('extension not added', function (data) {
                    alertMsg = '<div class="alert alert-danger"><strong>Inconsistent Database! </strong> Extension information not updated on remote server.</div>';
                  }); 
                  }

	      if(!(fs.existsSync( __dirname + '/upload/xml/'+ ip_address + '.xml')))
	      {
		  var xmlToInsert = "<include><context name=\"default\" ><extension name = \"default\" continue=\"true\"/></context></include>";
		  fs.writeFileSync(__dirname + '/upload/xml/'+ ip_address + '.xml',xmlToInsert);
	      }

	      var expressionValue = did_number; //no to insert(value of expression field)
	      var scriptPath = app.config.get("demoVirtualReceptionistScript");
	      var filePath = __dirname + '/upload/xml/' + ip_address + '.xml';	
	      var xmlToInsert = "<condition field = \"destination_number\" expression = \"" +expressionValue +"\"><action application=\"lua\" data=\""+scriptPath + "\"/> </condition>";	
	      require('./dialplan')(filePath,expressionValue,scriptPath,function(){
	      /*if (err)
	         console.log('error creating file');
	      else*/
	      {	
		  var remoteDialplanDir = app.config.get("remoteDialplanDir");
		  var remote_dialplan_path = remoteDialplanDir + app.config.get("remoteDialplanName"); 
		  require('./ftp')( __dirname + '/upload/xml/' + ip_address + ".xml",remote_dialplan_path,ip_address, app.config.get('ftp_username_demo_ivr'),app.config.get('ftp_pwd_demo_ivr'),function(err, data){
		  conn = new esl.Connection(ip_address, 8021, 'ClueCon', function() {
		      conn.api('reloadxml', function(result) {
		      console.log(result.getBody());
                      res.end(plates.bind(Views.accountActivated));
	           });
	         }); 
	       });
	      } 
	     });
	 });
});
       }
       else{
           console.log(err);
           alertMsg='<div class="alert alert-danger"><strong>Sorry</strong> Account is already present, please choose another .</div>';
           console.log(userobj);
           res.redirect('/login');
           }
       });
     });
    }
    else {
           console.log(err);
           alertMsg='<div class="alert alert-danger"><strong>Sorry</strong> Unable to allocate hosting number, please try after some time .</div>';
           console.log(userobj);
           res.redirect('/login');
    }
    });

    //res.writeHead(200, { 'Content-Type': 'text/html' });
    //res.end(plates.bind(Views.accountActivated));
    //alertMsg='';
    });
   }
   else{
   alertMsg='<div class="alert alert-danger"><strong>Sorry</strong> Unable to Activate the account, please try after some time .</div>';
   console.log(userobj);
   res.redirect('/login');
   }
  });
  });
});



app.router.post('/admin/deleteUser', function() {
  var ids= [];
  if(this.req.body.id){
    if( typeof this.req.body.id == 'string')
      ids.push(this.req.body.id);
    else
      ids = this.req.body.id;
    var username = this.req.body.username;
    app.db.models.user.find({_id:{ $in:ids}}).remove().exec(function (err, userobj) {
       if(!err) {
          alertMsg='<div class="alert alert-danger"><strong>'+username+'</strong> Username is deleted successfully .</div>';
       }
       else{
          console.log(err);
          alertMsg='<div class="alert alert-danger"><strong>'+username+'</strong>'+JSON.stringify(err)+'</div>';
       }

    });
  }
  else{
      alertMsg='<div class="alert alert-danger"><strong>No Item </strong> is selected</div>';
  }
  this.res.redirect('/admin?page=1&limit=10&username=&email=&sort=');
});

app.router.get('/client', function(skip,limit) {
  limit = this.req.query.limit ? parseInt(this.req.query.limit, null) : 20;
  skip = this.req.query.page ? parseInt(this.req.query.page, null) : 1;
  client_name = this.req.query.client_name ? this.req.query.client_name : '';
  client_email = this.req.query.email ? this.req.query.email : '';
  sort = this.req.query.sort ? this.req.query.sort : '_id';
  client_phone = '';
  if (!limit) {
      limit = 5;
  }
  if (!skip) {
      skip = 1;
  }
  nxt = skip+1;
  prev = skip - 1;
  if(prev < 1)
    prev = 1;

  app.log.info('client page');
  var res = this.res;
  if (this.req.isAuthenticated()) {
    var filters = {};
    filters.client_name = new RegExp('^.*?'+ client_name +'.*$', 'i');
    filters.client_email = new RegExp('^.*?'+ client_email +'.*$', 'i');

    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.client.find(filters,'_id client_name client_email ').lean().skip((skip-1)*limit).limit(limit).sort(sort).exec(function (err, client) {
      var resultList = '';
      if(skip == 1 ){
         if(client.length !=  limit)
            page ='';
         else
            page = '<li><a href="/client?page='+nxt+'&limit='+limit+'&client_name='+client_name+'&email='+client_email+'&sort='+sort+'">Next</a></li>';
       }
      else if(client.length !=  limit)
         page = '<li><a href="/client?page='+prev+'&limit='+limit+'&client_name='+client_name+'&email='+client_email+'&sort='+sort+'">Previous</a></li>';
      else
         page = '<li><a href="/client?page='+prev+'&limit='+limit+'&client_name='+client_name+'&email='+client_email+'&sort='+sort+'">Previous</a></li><li><a href="/client?page='+nxt+'&limit='+limit+'&client_name='+client_name+'&email='+client_email+'&sort='+sort+'">Next</a></li>';
      for(var i=0;i<client.length;i++) {
        console.log(client[i].client_phone_number);
        resultList += '<tr class="clickableRow" href="/client/editClient/'
        + client[i]._id +'"><td style="width:22px"><label class="checkbox-inline"><input type="checkbox" name="id" value="'
        + client[i]._id+'"></label></td><td>' 
        + client[i].client_name + '</td><td>'
        + client[i].client_email + '</td><td>'
        + client[i].client_phone_number + '</td></a></tr>';
      }
      res.end(plates.bind(Views.client, {'clientlist':resultList, 'alertMsg':alertMsg , 'page':page}));
      alertMsg='';
    });
  }
  else{
    console.log("user is not authenticated");
    res.redirect('/login');
  }
});

app.router.path('/client/addClient', function() {
  this.get(function() {
  if (this.req.isAuthenticated()) {
    var username = this.req.user.username;
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    this.res.end(plates.bind(Views.addClient, {'alertMsg':alertMsg}));
    alertMsg='';
  }
  else{
    console.log("user is not authenticated");
    this.res.redirect('/');
  }
  });

  this.post(function() {
  console.log("Client is added");
  var req = this.req;
  var res = this.res;
  var client_name = req.body.client_name;
  var client_address = req.body.address;
  var client_email = req.body.email;
  var client_phone_number = req.body.phone;
  var client_contact_person = req.body.contact_person;
  var client_contact_phone = req.body.contact_phone;
  console.log(client_name + client_address + client_email+client_phone_number+client_contact_person+client_contact_phone);
  if (this.req.isAuthenticated()) {
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.client.create({"client_name" : client_name, "client_address" : client_address, "client_email" : client_email, "client_phone_number" : client_phone_number, "client_contact_person" : client_contact_person, "client_contact_phone" : client_contact_phone}, function (err, clientobj) {
       if(!err){
          console.log(clientobj);
          alertMsg='<div class="alert alert-success"><strong>Success !</strong> New Client :'+client_name+' is added.</div>';
          res.redirect('/client');
       }
       else{
          console.log(err);
          alertMsg='<div class="alert alert-danger"><strong>'+client_name+'</strong> Client name is already present, please choose another .</div>';
          res.redirect('/client/addClient');
       }
    });
   }
  else{
    console.log("user is not authenticated");
    res.redirect('/');
   }
 });

  });
app.router.path('/client/editClient/:client_id', function(client_id) {
  this.get(function(client_id) {
  var res = this.res;
  if (this.req.isAuthenticated()) {
    var username = this.req.user.username;
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.client.find({_id:client_id}).lean().exec(function (err, clientobj) {
    var client = "<input type='text' class='form-control'name='client_name' value='"+clientobj[0].client_name+"' readonly='true'>";
    var address = "<input type='text' class='form-control'name='address' value='"+clientobj[0].client_address+"' >";
    var email = "<input type=text class='form-control' id='em' name='email' value='"+clientobj[0].client_email+"'>";
    var phone = "<input type='text' class='form-control'name='phone' value='"+clientobj[0].client_phone_number+"' >";
    var contact_person = "<input type='text' class='form-control'name='contact_person' value='"+clientobj[0].client_contact_person+"' >";
    var contact_phone = "<input type='text' class='form-control'name='contact_phone' value='"+clientobj[0].client_contact_phone+"' >";
    var id = "<input type=hidden name='id' id='uid' value='"+clientobj[0]._id+"'</input>";
    res.end(plates.bind(Views.editClient, {'clientName':client,'address':address, 'email':email,'phone' :phone,'contact_person': contact_person,'contact_phone':contact_phone, '_id':id, 'alertMsg':alertMsg}));
    alertMsg='';
    });
   }
  else{
    console.log("user is not authenticated");
    res.redirect('/');
   }
  });
});


app.router.post('/client/saveClient', function() {
  console.log("user is saved");
  var res = this.res;
  var client_address = this.req.body.address;
  var client_email = this.req.body.email;
  var client_phone_number = this.req.body.phone;
  var client_contact_person = this.req.body.contact_person;
  var client_contact_phone = this.req.body.contact_phone;
  var id = this.req.body.id;
  console.log(client_address + client_email+client_phone_number+client_contact_person+client_contact_phone + id);
  if (this.req.isAuthenticated()) {
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.client.update({_id: id}, {$set: {client_address:client_address, client_email: client_email, client_phone_number : client_phone_number, client_contact_person : client_contact_person, client_contact_phone : client_contact_phone}}, {upsert: true}).exec(function (err, userobj) {
    if(!err){
        alertMsg = '<div class="alert alert-success"><strong>Success ! </strong> User information changed.</div>';
        var redirectUrl = "/client/editClient/"+id;
        res.redirect(redirectUrl);
    }
    });
  }
  else{
    console.log("user is not authenticated");
    res.redirect('/');
  }
 });

app.router.post('/client/deleteClient', function() {
  var ids= [];
  if(this.req.body.id){
    if( typeof this.req.body.id == 'string')
      ids.push(this.req.body.id);
    else
      ids = this.req.body.id;
    var client_name = this.req.body.client_name;
    app.db.models.client.find({_id:{ $in:ids}}).remove().exec(function (err, userobj) {
       if(!err) {
          alertMsg='<div class="alert alert-danger"><strong>'+client_name+'</strong> Username is deleted successfully .</div>';
       }
       else{
          console.log(err);
          alertMsg='<div class="alert alert-danger"><strong>'+client_name+'</strong>'+JSON.stringify(err)+'</div>';
       }

    });
  }
  else{
      alertMsg='<div class="alert alert-danger"><strong>No Item </strong> is selected</div>';
  }
  this.res.redirect('/client?page=1&limit=10&client_name=&email=&sort=');
});


app.router.get('/did', function(skip,limit) {
  
  limit = this.req.query.limit ? parseInt(this.req.query.limit, null) : 20;
  skip = this.req.query.page ? parseInt(this.req.query.page, null) : 1;
  client_name = this.req.query.client_name ? this.req.query.client_name : '';
  did_number = this.req.query.did_number ? this.req.query.did_number : '';
  sort = this.req.query.sort ? this.req.query.sort : '_id';
  client_phone = '';
  if (!limit) {
      limit = 5;
  }
  if (!skip) {
      skip = 1;
  }
  nxt = skip+1;
  prev = skip - 1;
  if(prev < 1)
    prev = 1;

  app.log.info('did page');
  var res = this.res;
 if (this.req.isAuthenticated()) {
    var filters = {};
    var username = this.req.user.username;
    var roles = this.req.user.roles;
    var addDid = '';
    var search_client = '<label>Search by DID number</label><input name="did_number" type="text" class="form-control">';
    if(roles == 'admin'){
      addDid = '<button  name="addDid" class="btn btn-lg btn-primary pull-right"  value="addDid" onclick="location.href='
                    +"'/did/addDid'"+';">Add Did</button>';
      search_client = '<label>Search by Client name</label><input name="client_name" type="text" class="form-control">';
      filters.client_name = new RegExp('^.*?'+ client_name +'.*$', 'i');
    }
    else
      filters.client_name = new RegExp('^.*?'+ this.req.user.username +'.*$', 'i');
    filters.did_number = new RegExp('^.*?'+ did_number +'.*$', 'i');

    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.did.find(filters,'_id did_number ip_address client_name ').lean().skip((skip-1)*limit).limit(limit).sort(sort).exec(function (err, did) {
      var resultList = '';
      if(skip == 1 ){
         if(did.length !=  limit)
            page ='';
         else
            page = '<li><a href="/did?page='+nxt+'&limit='+limit+'&client_name='+client_name+'&did_number='+did_number+'&sort='+sort+'">Next</a></li>';
       }
      else if(did.length !=  limit)
         page = '<li><a href="/did?page='+prev+'&limit='+limit+'&client_name='+client_name+'&did_number='+did_number+'&sort='+sort+'">Previous</a></li>';
      else
         page = '<li><a href="/did?page='+prev+'&limit='+limit+'&client_name='+client_name+'&did_number='+did_number+'&sort='+sort+'">Previous</a></li><li><a href="/did?page='+nxt+'&limit='+limit+'&client_name='+client_name+'&did_number='+did_number+'&sort='+sort+'">Next</a></li>';
      for(var i=0;i<did.length;i++) {
        console.log(did[i].did_number);
         //if(roles == 'admin'){
           resultList += '<tr class="clickableRow" href="/did/editDid/'
                         + did[i]._id  +'"><td style="width:22px"><label class="checkbox-inline"><input type="checkbox" name="id" value="';
          /* }
         else{
          resultList += '<tr class="clickableRow" href="/report?did_number='+ did[i].did_number +'"><td style="width:22px"><label class="checkbox-inline"><input type="checkbox" name="id" value="';
           }*/
        resultList +=
        /*resultList += '<tr class="clickableRow" href="/did/editDid/'
        + did[i]._id +'"><td style="width:22px"><label class="checkbox-inline"><input type="checkbox" name="id" value="'*/
          did[i]._id+'"></label></td><td>' 
        + did[i].did_number + '</td><td>'
        + did[i].client_name + '</td><td>'
        + did[i].ip_address + '</td></a></tr>';
      }
    //if(roles == 'admin'){
      res.write(plates.bind(Views.header, {'username':username}));
      res.write(plates.bind(Views.sidebar, {'alertMsg':alertMsg}));
      res.end(plates.bind(Views.did, {'didlist':resultList, 'alertMsg':alertMsg , 'page':page,'username':username, 'addDid_btn': addDid, 'search_client': search_client}));
   /* }
    else{
      res.end(plates.bind(Views.clientDid, {'didlist':resultList, 'alertMsg':alertMsg , 'page':page,'username':username}));
    }*/
      alertMsg='';
    });
  }
  else{
    console.log("user is not authenticated");
    res.redirect('/login');
  }
});


app.router.get('/did/addDid', function(){
  if (this.req.isAuthenticated() && (this.req.user.roles == 'admin')) {
       var username = this.req.user.username;
       var filters ={};
       var resultList ='';
       var res = this.res;
       this.res.writeHead(200, { 'Content-Type': 'text/html' })
     filters.roles =  new RegExp('^.*?'+ 'user' +'.*$', 'i'); 
     app.db.models.user.find(filters,'username').lean().exec(function (err, client) {
     console.log(client);
     for(var i=0;i<client.length;i++) {
     console.log(client[i].username);
        resultList += '<option value ="'+client[i].username+'">'+client[i].username+'</option>';
      }
     console.log(resultList);
     //res.end(plates.bind(Views.addAccount, {'client_name': resultList , 'alertMsg': alertMsg,'username':username}));
      res.write(plates.bind(Views.header, {'username':username}));
      res.write(plates.bind(Views.sidebar, {'alertMsg':alertMsg}));
       res.end(plates.bind(Views.addDid, {'client_name': resultList ,'alertMsg':alertMsg,'username':username}));
       });
      }

  else {
      if (this.req.isAuthenticated()){
        this.res.redirect('/did');
        }
      else{
       app.log.info('login page');
       this.res.writeHead(200, { 'Content-Type': 'text/html' })
       this.res.end(Views.login);
      }
  }
  });

// app.router.post('/did/addDid',function() {
  app.router.post('/did/addDid',{ stream: true },function() {
  var req = this.req,
      res = this.res,
      script_name='',
      script_path = '';
      console.log('Receiving file upload');
 var form = new formidable.IncomingForm({ uploadDir: __dirname+'/upload' }),
        files = [],
        fields = [],
        path = [],
        RemotePath =[];

		//form.keepExtensions = true;
   form.uploadDir = __dirname + app.config.get("localUploadDir");
   remoteUploadDir = app.config.get("remoteUploadDir");		  
   remoteDialplanDir = app.config.get("remoteDialplanDir");
 form
     .on('field', function(field, value) {
       console.log(field, value);
       fields.push([field, value]);
     })
     .on('file', function(field, file) {
       //console.log(field, file);
       files.push([field, file]);
        })
     .on('fileBegin', function(name, file) {
      //console.log (file.type + " check it : " +util.inspect(fields)); 
      if(file.type == 'text/x-lua'){
       file.name = fields[0][1] + ".lua";
       script_name = file.name;    
       file.path = form.uploadDir + "scripts/" + file.name;
       script_path = file.path;
       remote_path = remoteUploadDir + "scripts/" + file.name;    
       path.push([file.path, remote_path]);
       }
       if(file.type == 'audio/mpeg' || file.type == 'audio/mp3' ){
       file.name = fields[0][1] + "_" + file.name;	 
       file.path = form.uploadDir + "audio/" + file.name;
       remote_path = remoteUploadDir + "audio/" + file.name;    
       path.push([file.path, remote_path]);
       }
     })
     .on('progress', function(rec, expected) {
         //console.log("progress: " + rec + " of " +expected);
         //console.log('\nuploaded %s to %s',  files.image.filename, files.image.path);
       })
     .on('end', function() {
       
       if ( fields[2][1] != null || fields [2][1] != '' )
       {
         app.db.models.did.create({"client_name" : fields[1][1], "ip_address" : fields[2][1], "did_number" : fields[0][1] , "ftp_username" : fields[3][1] , "ftp_password" : fields[4][1] } , function (err, clientobj) {
           if(!err){
           // console.log(clientobj);
            alertMsg='<div class="alert alert-success"><strong>Success !</strong> New DID :'+fields[0][1]+' is added.</div>';
	    fs.exists(form.uploadDir + 'xml/'+ fields[2][1] + '.xml', function(exists) {
	    if (!exists ) {
		console.log('Creating');
		var xmlToInsert = "<include><context name=\"default\" ><extension name = \"default\" continue=\"true\"/></context></include>";
		fs.writeFile(form.uploadDir + '/xml/'+ fields[2][1] + '.xml',xmlToInsert, function(err){
		if (err)
		    console.log('error creating file');
		else
		{
		    console.log('default file for given IP is created');
		   // console.log(fields[0][1]+ fields[2][1]);
		    var ip_port = fields[2][1];
		    var filePath = form.uploadDir + 'xml/'+ fields[2][1] + '.xml';
		    var expressionValue = fields[0][1]; //no to insert(value of expression field)
		    var scriptPath = remoteUploadDir + 'scripts/'+ fields[0][1] + '.lua';
		    var remote_dialplan_path = remoteDialplanDir + app.config.get("remoteDialplanName"); ;
		    require('./dialplan')(filePath,expressionValue,scriptPath,function(){
			require('./ftp')(form.uploadDir + "xml/"+ fields[2][1] + ".xml",remote_dialplan_path,fields[2][1],fields[3][1],fields[4][1], function(err, data){
			    conn = new esl.Connection(fields[2][1], 8021, 'ClueCon', function() {
				    conn.api('reloadxml', function(res) {
					    console.log(res.getBody());
				    });
				});
		
                            var j = 0;
			console.log(path);    
			function sendFile(i)    
			{   
			  if(i < path.length )
			  {  
			    localPath = path[i][0];
			    remotePath = path[i][1];
                            RemotePath.push([i,path[i][1]]); 
			    require('./ftp')(localPath,remotePath,fields[2][1],fields[3][1],fields[4][1], function(err, data){
				console.log("One file uploaded successfully");
                                //console.log(j);
                                if(j == path.length-1) {
					console.log("trying to create Socket connection with Freeswitch server.. ");
                                         var socket = app.io_client.connect('http://' + fields[2][1]+':' + app.config.get('syncPort'),{'force new connection': true});
                                           // Add a connect listener
                                         socket.emit('File Upload Done', JSON.stringify(RemotePath));
                                         socket.emit('add did', {"client_name" : fields[1][1], "ip_address" : fields[2][1], "did_number" : fields[0][1]});
                                         socket.on('did added', function(socket) {
			res.writeHead(200, {'content-type': 'text/plain'});
			//res.write('received fields:\n\n '+util.inspect(fields));
			//res.write('\n\n');
                        res.redirect('/did');
			//res.end('received files:\n\n '+util.inspect(files));
                                         });
                                         socket.on('connect', function(socket) {
                                           console.log('NMS Client Connected!');
                                         });
                                         socket.on('error', function (reason){
                                            console.log(reason);
                                            alertMsg='<div class="alert alert-danger"><strong>'+fields[0][1]+'</strong> Client name is already present, please choose another .</div>';
                                            res.redirect('/did/addDid');
                                         });
                                         socket.on('disconnect', function (reason){
                                             //socket.destroy();
                                            console.log(reason);
                                            alertMsg='<div class="alert alert-danger"><strong>'+fields[0][1]+'</strong> Client name is already present, please choose another .</div>';
                                            res.redirect('/did/addDid');
                                         });

                                    }
                                 j++;
				 sendFile(i+1);
			      });
			  }
			 }
			 sendFile(0);
			 
		      });
		  });
	      } 
	      });
	    }else{
  		    console.log(fields[0][1]+ fields[2][1]);
		    var ip_port = fields[2][1];
		    var filePath = form.uploadDir + 'xml/'+ fields[2][1] + '.xml';
		    var expressionValue = fields[0][1]; //no to insert(value of expression field)
		    var scriptPath =  remoteUploadDir + 'scripts/'+ fields[0][1] + '.lua';
		    var xmlToInsert = "<condition field = \"destination_number\" expression = \"" +expressionValue +"\"><action application=\"lua\" data=\""+scriptPath + "\"/> </condition>";
		    var remote_dialplan_path = remoteDialplanDir + app.config.get("remoteDialplanName");
		    require('./dialplan')(filePath,expressionValue,scriptPath,function(){
			require('./ftp')(form.uploadDir + "xml/"+ fields[2][1] + ".xml",remote_dialplan_path,fields[2][1],fields[3][1],fields[4][1], function(err, data){
			    conn = new esl.Connection(fields[2][1], 8021, 'ClueCon', function() {
				    conn.api('reloadxml', function(res) {
					    console.log(res.getBody());
				    });
				});
			  
                            var j = 0;
			    console.log(path);
			function sendFile(i)
			{
			  if (i < path.length )
			  {  
			    localPath = path[i][0];
			    remotePath = path[i][1];
                            RemotePath.push([i,path[i][1]]); 
			    require('./ftp')(localPath,remotePath,fields[2][1],fields[3][1],fields[4][1], function(err, data){
				console.log("One file uploaded successfully");
                                console.log(j);
                                if(j == path.length-1) {
					 console.log("trying to create Socket connection with Freeswitch server.. "); 
                                         var socket = app.io_client.connect('http://' + fields[2][1]+':' + app.config.get('syncPort'), {'force new connection': true});
                                           // Add a connect listener
                                         socket.emit('File Upload Done', JSON.stringify(RemotePath));
                                         socket.emit('add did', {"client_name" : fields[1][1], "ip_address" : fields[2][1], "did_number" : fields[0][1]});
                                         socket.on('did added', function(socket) {
			res.writeHead(200, {'content-type': 'text/plain'});
			//res.write('received fields:\n\n '+util.inspect(fields));
			//res.write('\n\n');
                        res.redirect('/did');
			//res.end('received files:\n\n '+util.inspect(files));
                                         });
                                         socket.on('connect', function(socket) {
                                           console.log('NMS Client Connected!');
                                         });
                                         socket.on('error', function (reason){
                                            console.log(reason);
                                            alertMsg='<div class="alert alert-danger"><strong>'+fields[0][1]+'</strong> Client name is already present, please choose another .</div>';
                                            res.redirect('/did/addDid');
                                         });
                                         socket.on('disconnect', function (reason){
                                             //socket.destroy();
                                            console.log(reason);
                                            alertMsg='<div class="alert alert-danger"><strong>'+fields[0][1]+'</strong> Client name is already present, please choose another .</div>';
                                            res.redirect('/did/addDid');
                                         });
                                  }
                               sendFile(i+1);   
                               j++;
			    });
			  }  
			}
			sendFile(0);
		      });
		  });

	      
	    }
	 });
	} 
      else{
          console.log(err);
          alertMsg='<div class="alert alert-danger"><strong>'+fields[0][1]+'</strong> Client name is already present, please choose another .</div>';
          res.redirect('/did/addDid');
          }
      }); 
      }
      else{
          console.log(err);
          alertMsg='<div class="alert alert-danger"><strong>'+fields[0][1]+'</strong> Client name is already present, please choose another .</div>';
          res.redirect('/did/addDid');
          }
      });
     
     form.parse(req);
     req.buffer=false;
    });




app.router.path('/did/editDid/:did_id', function(did_id) {
  this.get(function(did_id) {
  var res = this.res;
  if (this.req.isAuthenticated()) {
    var roles = this.req.user.roles;
    if(roles == 'admin'){
       var type = 'text';
       var ip_label="IP Address";
    }
    else{
       var type = 'hidden';
       var ip_label="";
    }
    var username = this.req.user.username;
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.did.find({_id:did_id}).lean().exec(function (err, didobj) {
    console.log(didobj[0].isActive);
    var client = "<input type='text' class='form-control'name='client_name' value='"+didobj[0].client_name+"' readonly='' >";
    var ip_address = "<input type='"+type+"' class='form-control'name='ip_address' value='"+didobj[0].ip_address+"' >";
    var did_number = "<input type=text class='form-control' id='did_number' name='did_number' value='"+didobj[0].did_number+"' readonly=''>";
    if(didobj[0].isActive)
        var isActive = "<option value='"+didobj[0].isActive+"' selected>"+didobj[0].isActive+"</option><option value = 'false'>false</option>";
    else
        var isActive = "<option value='"+didobj[0].isActive+"' selected>"+didobj[0].isActive+"</option><option value = 'true'>true</option>";
    var id = "<input type=hidden name='id' id='uid' value='"+didobj[0]._id+"'</input>";
    res.end(plates.bind(Views.editDid, {'clientName':client,'ip_address':ip_address, 'did_number':did_number,'isActive' : isActive, '_id':id,'ip_label': ip_label , 'alertMsg':alertMsg,'username':username}));
    alertMsg='';
    });
  }
  else{
    console.log("user is not authenticated");
    res.redirect('/');
   }
  });
});

app.router.path('/did/editResources/:did_id', function(skip,limit,did_id) {
  this.get(function (did_id) {
  if(this.req.user.roles == 'admin' && this.req.isAuthenticated() )
  {
    var req =  this.req;
    var res =  this.res;
	app.db.models.did.find({_id : did_id }).lean().exec(function (err, didobj) {
	      if (!err && didobj.length > 0)
	      {
		limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
		skip =  req.query.page ? parseInt(req.query.page, null) : 1;
		clientname = req.query.username ? req.query.clientname : '';
		email = req.query.email ? req.query.email : '';
		sort = req.query.sort ? req.query.sort : '_id';
		header = didobj[0].client_name + "\t\t\t"+didobj[0].did_number;
		if (!limit) {
		    limit = 5;
		}
		if (!skip) {
		    skip = 1;
		}
		nxt = skip+1;
		prev = skip - 1;
		if(prev < 1)
		  prev = 1;

		app.log.info('Edit did resources screen');
		  var filters = {};
		  var username = req.user.username;
		  filters.username = new RegExp('^.*?'+ clientname +'.*$', 'i');
		  filters.email = new RegExp('^.*?'+ email +'.*$', 'i');
		  filters.roles = new RegExp('^.*?'+ 'user' +'.*$', 'i');

		  res.writeHead(200, { 'Content-Type': 'text/html' });
		  fs.readdir(__dirname + app.config.get("localUploadDir") + 'audio/',function (err,files){
		    if(!err)
		    {  
			    var resultList = '';
			    if(skip == 1 ){
			      if(files.length !=  limit)
				  page ='';
			      else
				  page = '<li><a href="/did/editResources/'+ did_id +'?page='+nxt+'&limit='+limit+'&username='+username+'&email='+email+'&sort='+sort+'">Next</a></li>';
			    }
			    else if(files.length !=  limit)
			      page = '<li><a href="/did/editResources/'+ did_id +'?page='+prev+'&limit='+limit+'&username='+username+'&email='+email+'&sort='+sort+'">Previous</a></li>';
			    else
			      page = '<li><a href="/did/editResources/'+ did_id +'?page='+prev+'&limit='+limit+'&username='+username+'&email='+email+'&sort='+sort+'">Previous</a></li><li><a href="/did/editResources/'+ did_id +'?page='+nxt+'&limit='+limit+'&username='+username+'&email='+email+'&sort='+sort+'">Next</a></li>';
			    
			    files.forEach(function(file){
			      var index = file.indexOf(didobj[0].did_number + '_' ); 
			      if ( index > -1 )
			      {	
				  resultList += '<tr><td style="width:22px"><label class="checkbox-inline"><input type="checkbox" name="id" value="'
				  +  file +'"></label></td><td>' 
				  + file.substring(didobj[0].did_number.length + 1) + '</td></tr>';
				  
			      }	  
			    });
			    var files = fs.readdirSync(__dirname + app.config.get("localUploadDir") + 'scripts/');
			    files.forEach(function(file){
			      var index = file.indexOf(didobj[0].did_number); 
			      if ( index > -1 )
			      {	
				  resultList += '<tr><td style="width:22px"><label class="checkbox-inline"><input type="checkbox" name="id" value="'
				  +  file +'"></label></td><td>' 
				  + file + '</td></tr>';
				  
			      }	  
			    });
			    
			    ip = '<input type="hidden" name = "ip_address" value="'+ didobj[0].ip_address +'">';
			    un = '<input type="hidden" name = "ftp_username" value="'+ didobj[0].ftp_username +'">';
			    pass = '<input type="hidden" name = "ftp_password" value="'+ didobj[0].ftp_password +'">';
			    id = '<input type="hidden" name = "ftp_password" value="'+ did_id +'">';
			    res.end(plates.bind(Views.editResources, {'filelist':resultList, 'alertMsg':alertMsg , 'page':page,'username':username, 'clientHeader' : header , 'ip' : ip, 'username' : un , 'password' : pass, 'did_id' : id }));
			    alertMsg='';
		    }
		    else
		    {
			 alertMsg = '<div class="alert alert-success"><strong>Failure ! </strong> Error fetching file list.</div>';
			 var redirectUrl = "/did/editResources/"+did_id;
			 res.redirect(redirectUrl);
          	    }
		  });
	      }
	      else
	      {
		console.log('error fetching client info : ' + JSON.stringify(err));
	      }
	});
	
  }
  else
  {
    res.redirect('/login');
  }
  });
});

app.router.post('/did/deleteFile', function() {
 if (this.req.isAuthenticated() && this.req.user.roles == 'admin') {
  var res = this.res;
  var req = this.req;
  
  var ip_address = req.body.ip_address;
  var username = req.body.ftp_username;
  var password = req.body.ftp_password;
  var did_id = req.body.did_id;
  var id = this.req.body.id;
  var body =  this.req.body;
  console.log(this.req.body)
  
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    function deleteFileLocal(i)
    {	
      path = '';
      if (i < body.id.length)
      {
	console.log("file :" + body.id[i]);
	if( body.id[i].substring(body.id[i].length - 3) == 'mp3')
	{
	   path = __dirname + app.config.get("localUploadDir") + 'audio/' + body.id[i];
	}
	if( body.id[i].substring(body.id[i].length - 3) == 'lua')
	{
	   path = __dirname + app.config.get("localUploadDir") + 'scripts/' + body.id[i];  
	} 
	if (path != ''){
	fs.unlink(path, function (err) {
	    if (err) throw console.log("Error deleting a file "+ err);
		console.log(body.id[i]+' is  deleted successfully');
	    deleteFileLocal(i+1)
	});  
	}
	else
	{
	  console.log("Unable to create a path , File type is not Supported");
	}  
      }	
    }
      
     deleteFileLocal(0);
     console.log("Specified files are deleted from local computer");
       
   function deleteFileRemote(i)
    {	
      if (i < body.id.length)
      {
	path = '';
	if( body.id[i].substring(body.id[i].length - 3) == 'mp3')
	{
	   path = __dirname + app.config.get("remoteUploadDir") + 'audio/' + body.id[i];
	}
	
	if( body.id[i].substring(body.id[i].length - 3) == 'lua')
	{
	   path = __dirname + app.config.get("remoteUploadDir") + 'scripts/' + body.id[i];
	   
	} 
	if (path != '' )  
	{
	  	var Ftp = new jsftp({
		  host: ip,
		  port: 21,
		  user: username,
		  pass: password
		});
		
	       Ftp.delete(path , function(err) {
		    if (err) {
		      console.error("Error deleting "+ path +" from remote Server : " +err);
		      //callback(err);
		    }
		    else {
		      console.log(path + " is Deleted successfully ");
		      deleteFileRemote(i+1);
		    }
		});
	}	
	else
	{ console.log("Unable to create a path, File type is not Supported");}
      }	
    }
     console.log("Creating FTP connection to delete remote files ");
     deleteFileRemote(0);
   
     alertMsg = '<div class="alert alert-success"><strong>Success ! </strong> DID information changed.</div>';
        var redirectUrl = "/did/editResources/"+did_id;
        res.redirect(redirectUrl);
  }
  else{
    console.log("user is not authenticated");
    res.redirect('/');
  }
  
 });





app.router.post('/did/saveDid', function() {
  console.log("DID is saved");
  var res = this.res;
  var req = this.req;
  var client_name = req.body.client_name;
  var did_number = req.body.did_number;
  var ip_address = req.body.ip_address;
  var isActive = req.body.isActive;
  console.log(client_name + ip_address + did_number+isActive);
  var id = this.req.body.id;
  if (this.req.isAuthenticated()) {
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.did.update({_id: id}, {$set: {client_name:client_name, did_number: did_number, ip_address : ip_address, isActive : isActive}}, {upsert: true}).exec(function (err, userobj) {
    if(!err){
         var socket = app.io_client.connect('http://'+ip_address+':' + app.config.get('syncPort'), {'force new connection': true});
                                           // Add a connect listener
                                         socket.emit('edit did',{client_name:client_name, did_number: did_number, ip_address : ip_address, isActive : isActive});
                                         socket.on('connect', function(socket) {
                                         console.log('NMS Client Connected!');
                                         });
                                         socket.on('did edited', function (data) {
        alertMsg = '<div class="alert alert-success"><strong>Success ! </strong> DID information changed.</div>';
        var redirectUrl = "/did/editDid/"+id;
        res.redirect(redirectUrl);
       });
    }
    });
  }
  else{
    console.log("user is not authenticated");
    res.redirect('/');
  }
 });


app.router.post('/did/deleteDid', function() {
  var ids= [];
  if(this.req.body.id && this.req.user.roles === 'admin'){
    if( typeof this.req.body.id == 'string')
      ids.push(this.req.body.id);
    else
      ids = this.req.body.id;
    var did_number = this.req.body.did_number;
    app.db.models.did.find({_id:{ $in:ids}}).remove().exec(function (err, userobj) {
       if(!err) {
          alertMsg='<div class="alert alert-danger"><strong>'+did_number+'</strong> DID is deleted successfully .</div>';
       }
       else{
          console.log(err);
          alertMsg='<div class="alert alert-danger"><strong>'+did_number+'</strong>'+JSON.stringify(err)+'</div>';
       }

    });
  }
  else{
      alertMsg='<div class="alert alert-danger"><strong>No Item </strong> is selected</div>';
  }
  this.res.redirect('/did?page=1&limit=10&client_name=&email=&sort=');
});

app.router.post('/did/deleteAccount', function() {
  var ids= [];
  if(this.req.body.id){
    if( typeof this.req.body.id == 'string')
      ids.push(this.req.body.id);
    else
      ids = this.req.body.id;
    var client_id = this.req.body.client_name;
    app.db.models.account_detail.find({_id:{ $in:ids}}).remove().exec(function (err, userobj) {
       if(!err) {
          alertMsg='<div class="alert alert-danger"><strong>'+client_id+"</strong>'s Account is deleted successfully .</div>";
       }
       else{
          console.log(err);
          alertMsg='<div class="alert alert-danger"><strong>'+client_id+'</strong>'+JSON.stringify(err)+'</div>';
       }

    });
  }
  else{
      alertMsg='<div class="alert alert-danger"><strong>No Item </strong> is selected</div>';
  }
  this.res.redirect('/account_summary');
});

app.router.get('/inbox', function(skip,limit) {
  
  limit = this.req.query.limit ? parseInt(this.req.query.limit, null) : 40;
  skip = this.req.query.page ? parseInt(this.req.query.page, null) : 1;
  incoming_phone_number = this.req.query.incoming_phone_number ? this.req.query.incoming_phone_number : '';
  did_number = this.req.query.did_number ? this.req.query.did_number : '';
  sort = this.req.query.sort ? this.req.query.sort : '_id';
  client_phone = '';
  if (!limit) {
      limit = 5;
  }
  if (!skip) {
      skip = 1;
  }
  nxt = skip+1;
  prev = skip - 1;
  if(prev < 1)
    prev = 1;

  app.log.info('inbox page');
  var res = this.res;
  var req = this.req;
 if (this.req.isAuthenticated()) {
    var filters = {};
    var filters_add = {};
    var roles = this.req.user.roles;
    var username = this.req.user.username;
    var recordingPath = app.config.get('ip_for_demo_ivr')+':9011/recording/';
    if(roles != 'admin')
      filters.client_id = req.user.username;
    filters.did_number = new RegExp('^.*?'+ did_number +'.*$', 'i');
    filters.incoming_phone_number = new RegExp('^.*?'+ incoming_phone_number +'.*$', 'i');

    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.call_detail.find(filters).lean().skip((skip-1)*limit).limit(limit).sort(sort).exec(function (err, report) {
      var resultList = '';
      if(skip == 1 ){
         if(report.length !=  limit)
            page ='';
         else
            page = '<li><a href="/inbox?page='+nxt+'&limit='+limit+'&incoming_phone_number='+incoming_phone_number+'&sort='+sort+'">Next</a></li>';
       }
      else if(report.length !=  limit)
         page = '<li><a href="/inbox?page='+prev+'&limit='+limit+'&incoming_phone_number='+incoming_phone_number+'&sort='+sort+'">Previous</a></li>';
      else
         page = '<li><a href="/inbox?page='+prev+'&limit='+limit+'&incoming_phone_number='+incoming_phone_number+'&sort='+sort+'">Previous</a></li><li><a href="/inbox?page='+nxt+'&limit='+limit+'&incoming_phone_number='+incoming_phone_number+'&sort='+sort+'">Next</a></li>';

      filters_add.client_id = new RegExp('^.*?'+ req.user.username +'.*$', 'i');
      app.db.models.did.find({},'did_number ip_address').lean().exec(function (err, did) {

      function getContactName(i) {
      if(i<report.length){
      filters_add.phone_number = report[i].incoming_phone_number ;
      app.db.models.addressBook.find(filters_add).lean().exec(function (err, contact) {
        console.log("i" + i);
        if(!err && contact.length > 0)
          incoming_phone_number = contact[0].name;
        else
          incoming_phone_number = report[i].incoming_phone_number;

        for(var k=0;k<did.length;k++){
          if(did[k].did_number === report[i].did_number){
               if(did[k].ip_address)
                    recordingPath = did[k].ip_address + ':9011/recording/';
          }
        }

         
          //incoming_phone_number = report[i].incoming_phone_number;
        resultList += '<tr><td style="width:22px"><label class="checkbox-inline"><input type="checkbox" name="id" value="'
        + report[i]._id+'"></label></td><td onclick="getTranscription('+report[i].incoming_phone_number+');">';
         if(incoming_phone_number === report[i].incoming_phone_number)
            resultList += report[i].did_number + '</td><td class="clickable" onclick="addContact('+report[i].incoming_phone_number+');">';
         else
            resultList += report[i].did_number + '</td><td>';
         resultList += incoming_phone_number + '</td><td onclick="getTranscription('+report[i].incoming_phone_number+');">'
        + report[i].client_id + '</td><td onclick="getTranscription('+report[i].incoming_phone_number+');">'
        + report[i].call_time + '</td><td onclick="getTranscription('+report[i].incoming_phone_number+');">'
        + report[i].duration + '</td><td onclick="getTranscription('+report[i].incoming_phone_number+');">'
        + report[i].no_of_pulse + '</td><td onclick="getTranscription('+report[i].incoming_phone_number+');">'
        + report[i].hangup_cause + '</td>';
        if(report[i].bridged_id != undefined)
           resultList += '<td>'+report[i].bridged_to+'</td><td>'
           +  report[i].bridged_duration+'</td><td><a href="http://'+recordingPath+report[i].bridged_id+'" target="_blank">click to play </a></td></tr>';
        else
           resultList += '<td></td><td></td><td></td></tr>';
        getContactName(i+1);
       if(i === report.length -1){
      res.write(plates.bind(Views.header, {'username':username}));
      res.write(plates.bind(Views.sidebar, {'alertMsg':alertMsg}));
      res.end(plates.bind(Views.inbox, {'report':resultList,'username':username, 'alertMsg':alertMsg , 'page':page}));
      alertMsg='';
      }
       });
      }
      }
       if(report.length >0)
          getContactName(0);
       else {
      res.write(plates.bind(Views.header, {'username':username}));
      res.write(plates.bind(Views.sidebar, {'alertMsg':alertMsg}));
      res.end(plates.bind(Views.inbox, {'report':resultList,'username':username, 'alertMsg':alertMsg , 'page':page}));
      alertMsg='';
      }
    });
    });
  }
  else{
    console.log("user is not authenticated");
    res.redirect('/login');
  }
});


app.router.get('/voicemail', function(skip,limit) {
  
  limit = this.req.query.limit ? parseInt(this.req.query.limit, null) : 20;
  skip = this.req.query.page ? parseInt(this.req.query.page, null) : 1;
  incoming_phone_number = this.req.query.incoming_phone_number ? this.req.query.incoming_phone_number : '';
  did_number = this.req.query.did_number ? this.req.query.did_number : '';
  sort = this.req.query.sort ? this.req.query.sort : '_id';
  client_phone = '';
  if (!limit) {
      limit = 5;
  }
  if (!skip) {
      skip = 1;
  }
  nxt = skip+1;
  prev = skip - 1;
  if(prev < 1)
    prev = 1;

  app.log.info('did page');
  var res = this.res;
  var req = this.req;
 if (this.req.isAuthenticated()) {
    var filters = {};
    var filters_add = {};
    var roles = this.req.user.roles;
    var username = this.req.user.username;
    var voicemailPath = app.config.get('ip_for_demo_ivr')+':9011/voicemail/';
    if(roles != 'admin')
      filters.client_id = req.user.username;
    filters.did_number = new RegExp('^.*?'+ did_number +'.*$', 'i');
    filters.incoming_phone_number = new RegExp('^.*?'+ incoming_phone_number +'.*$', 'i');

    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.voicemail.find(filters).lean().skip((skip-1)*limit).limit(limit).sort(sort).exec(function (err, report) {
        console.log("report"+report);
      var resultList = '';
      if(skip == 1 ){
         if(report.length !=  limit)
            page ='';
         else
            page = '<li><a href="/voicemail?page='+nxt+'&limit='+limit+'&incoming_phone_number='+incoming_phone_number+'&sort='+sort+'">Next</a></li>';
       }
      else if(report.length !=  limit)
         page = '<li><a href="/voicemail?page='+prev+'&limit='+limit+'&incoming_phone_number='+incoming_phone_number+'&sort='+sort+'">Previous</a></li>';
      else
         page = '<li><a href="/voicemail?page='+prev+'&limit='+limit+'&incoming_phone_number='+incoming_phone_number+'&sort='+sort+'">Previous</a></li><li><a href="/voicemail?page='+nxt+'&limit='+limit+'&incoming_phone_number='+incoming_phone_number+'&sort='+sort+'">Next</a></li>';

      filters_add.client_id = new RegExp('^.*?'+ req.user.username +'.*$', 'i');
      app.db.models.did.find({},'did_number ip_address').lean().exec(function (err, did) {
      console.log(JSON.stringify(did));

      function getContactName(i) {
      if(i<report.length){
      filters_add.phone_number = report[i].incoming_phone_number ;
      app.db.models.addressBook.find(filters_add).lean().exec(function (err, contact) {
        console.log("report"+JSON.stringify(report));
        console.log("i" + i);
        if(!err && contact.length > 0)
          incoming_phone_number = contact[0].name;
        else
          incoming_phone_number = report[i].incoming_phone_number;
        
        for(var k=0;k<did.length;k++){
          if(did[k].did_number === report[i].did_number){
               if(did[k].ip_address)
                    voicemailPath = did[k].ip_address + ':9011/voicemail/';             
          }
        }
 
          //incoming_phone_number = report[i].incoming_phone_number;
        resultList += '<tr><td style="width:22px"><label class="checkbox-inline"><input type="checkbox" name="id" value="'
        + report[i]._id+'"></label></td><td onclick="getTranscription('+report[i].incoming_phone_number+');">';
         if(incoming_phone_number === report[i].incoming_phone_number)
            resultList += report[i].did_number + '</td><td class="clickable" onclick="addContact('+report[i].incoming_phone_number+');">';
         else
            resultList += report[i].did_number + '</td><td>';
         resultList += incoming_phone_number + '</td><td>'
        + report[i].client_id + '</td><td>'
        + report[i].call_time + '</td><td>'
        + report[i].duration + '</td><td>'
        + report[i].call_to_number + '</td><td><a href="http://'+voicemailPath+report[i]._id+'" target="_blank">click to play </a></td></tr>';
        getContactName(i+1);
       if(i === report.length -1){
      res.write(plates.bind(Views.header, {'username':username}));
      res.write(plates.bind(Views.sidebar, {'alertMsg':alertMsg}));
      res.end(plates.bind(Views.voicemail, {'report':resultList,'username':username, 'alertMsg':alertMsg , 'page':page}));
      alertMsg='';
      }
       });
      }
      }
       if(report.length >0)
          getContactName(0);
       else {
      res.write(plates.bind(Views.header, {'username':username}));
      res.write(plates.bind(Views.sidebar, {'alertMsg':alertMsg}));
      res.end(plates.bind(Views.inbox, {'report':resultList,'username':username, 'alertMsg':alertMsg , 'page':page}));
      alertMsg='';
      }
    });
    });
  }
  else{
    console.log("user is not authenticated");
    res.redirect('/login');
  }
});

app.router.get('/report', function(skip,limit) {
  
  limit = this.req.query.limit ? parseInt(this.req.query.limit, null) : 20;
  skip = this.req.query.page ? parseInt(this.req.query.page, null) : 1;
  incoming_phone_number = this.req.query.incoming_phone_number ? this.req.query.incoming_phone_number : '';
  did_number = this.req.query.did_number ? this.req.query.did_number : '';
  sort = this.req.query.sort ? this.req.query.sort : '_id';
  client_phone = '';
  if (!limit) {
      limit = 5;
  }
  if (!skip) {
      skip = 1;
  }
  nxt = skip+1;
  prev = skip - 1;
  if(prev < 1)
    prev = 1;

  app.log.info('did page');
  var res = this.res;
  var req = this.req;
 if (this.req.isAuthenticated()) {
    var filters = {};
    var filters_add = {};
    var roles = this.req.user.roles;
    var username = this.req.user.username;
    console.log(roles);
    if(roles != 'admin')
      filters.client_id = req.user.username;
    filters.did_number = new RegExp('^.*?'+ did_number +'.*$', 'i');
    filters.incoming_phone_number = new RegExp('^.*?'+ incoming_phone_number +'.*$', 'i');

    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.call_detail.find(filters).lean().skip((skip-1)*limit).limit(limit).sort(sort).exec(function (err, report) {
        console.log("report"+report);
      var resultList = '';

     if(skip == 1 ){
         if(report.length !=  limit)
            page ='';
         else
            page = '<li><a href="#" onclick=" getReport(\''+ +'\',\''+nxt+'\',\''+limit+'\')">Next</a></li>';
       }
      else if(list.length !=  limit)
         page = '<li><a href="#" onclick=" getReport(\''+list_name+'\',\''+prev+'\',\''+limit+'\')">Previous</a></li>';
      else
         page = '<li><a href="#" onclick=" getReport(\''+list_name+'\',\''+prev+'\',\''+limit+'\')">Previous</a></li><li><a href="#" onclick=" getReport(\''+list_name+'\',\''+nxt+'\',\''+limit+'\')">Next</a></li>';


      filters_add.client_id = new RegExp('^.*?'+ req.user.username +'.*$', 'i');

      function getContactName(i) {
      if(i<report.length){
      filters_add.phone_number = report[i].incoming_phone_number ;
      app.db.models.addressBook.find(filters_add).lean().exec(function (err, contact) {
        console.log("report"+JSON.stringify(report));
        console.log("i" + i);
        if(!err && contact.length > 0)
          incoming_phone_number = contact[0].name;
        else
          incoming_phone_number = report[i].incoming_phone_number;
         
          //incoming_phone_number = report[i].incoming_phone_number;
        resultList += '<tr><td style="width:22px"><label class="checkbox-inline"><input type="checkbox" name="id" value="'
        + report[i]._id+'"></label></td><td>';
         if(incoming_phone_number === report[i].incoming_phone_number)
            resultList += report[i].did_number + '</td><td>';
         else
            resultList += report[i].did_number + '</td><td>';
         resultList += incoming_phone_number + '</td><td>'
        + report[i].client_id + '</td><td>'
        + report[i].call_time + '</td><td>'
        + report[i].duration + '</td><td>'
        + report[i].no_of_pulse + '</td><td>'
        + report[i].hangup_cause + '</td></a></tr>';
        getContactName(i+1);
       if(i === report.length -1){
      res.write(plates.bind(Views.header, {'username':username}));
      res.write(plates.bind(Views.sidebar, {'alertMsg':alertMsg}));
      res.end(plates.bind(Views.report, {'report':resultList,'username':username, 'alertMsg':alertMsg , 'page':page}));
      alertMsg='';
      }
       });
      }
      }
       if(report.length >0)
          getContactName(0);
       else {
      res.write(plates.bind(Views.header, {'username':username}));
      res.write(plates.bind(Views.sidebar, {'alertMsg':alertMsg}));
      res.end(plates.bind(Views.report, {'report':resultList,'username':username, 'alertMsg':alertMsg , 'page':page}));
      alertMsg='';
      }
    });
  }
  else{
    console.log("user is not authenticated");
    res.redirect('/login');
  }
});
app.router.post('/report', function(skip,limit) {
  
  limit = this.req.body.limit ? parseInt(this.req.body.limit, null) : 20;
  limit  = 1;
  skip = this.req.body.skip ? parseInt(this.req.body.skip, null) : 1;
  incoming_phone_number = this.req.body.phone_number ? this.req.body.phone_number : '';
  did_number = this.req.query.did_number ? this.req.query.did_number : '';
  sort = this.req.body.sort ? this.req.body.sort : '_id';
  fromDate = this.req.body.fromDate ? this.req.body.fromDate : '';
  toDate = this.req.body.toDate ? this.req.body.toDate : '';
  requestType = this.req.body.requestType ? this.req.body.requestType : '';
 // console.log("Report"+ limit +":"+ incoming_phone_number +":"+ sort +":"+ fromDate +":"+ toDate);
  client_phone = '';
  if (!limit) {
      limit = 5;
  }
  if (!skip) {
      skip = 1;
  }
  nxt = skip+1;
  prev = skip - 1;
  if(prev < 1)
    prev = 1;

  console.log("skip : "+limit+ skip); 
  app.log.info('did page');
  var res = this.res;
  var req = this.req;
 if (this.req.isAuthenticated()) {
    var filters = {};
    var page ='';
    var filters_add = {};
    var roles = this.req.user.roles;
    var username = this.req.user.username;
    if(roles != 'admin')
      filters.client_id = new RegExp('^.*?'+ req.user.username +'.*$', 'i');
    filters.did_number = new RegExp('^.*?'+ did_number +'.*$', 'i');
    filters.timeCreated  = {"$gte": new Date(fromDate), "$lt": new Date(toDate)};
    filters.incoming_phone_number = new RegExp('^.*?'+ incoming_phone_number +'.*$', 'i');

    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    if(requestType === 'download'){
       limit = 1000; 
    }
    app.db.models.call_detail.find(filters).lean().skip((skip-1)*limit).limit(limit).sort(sort).exec(function (err, report) {
        console.log("report"+report);
      var resultList = '';

     console.log("length : "+ report.length + "limit : "+ limit);
     if(skip == 1 ){
         if(report.length !=  limit)
            page ='';
         else
            page = '<li><a href="#" onclick=" getReport(\''+"" +'\',\''+nxt+'\',\''+limit+'\')">Next</a></li>';
       }
      else if(report.length !=  limit){
         page = '<li><a href="#" onclick=" getReport(\''+ "" +'\',\''+prev+'\',\''+limit+'\')">Previous</a></li>';
         console.log("else if");
      }
      else{
         page = '<li><a href="#" onclick=" getReport(\''+ "" +'\',\''+prev+'\',\''+limit+'\')">Previous</a></li><li><a href="#" onclick=" getReport(\''+""+'\',\''+nxt+'\',\''+limit+'\')">Next</a></li>';
         console.log("else");
      }
      filters_add.client_id = new RegExp('^.*?'+ req.user.username +'.*$', 'i');
      console.log("page : "+ limit + ":" + skip + ":"+prev + ":" + sort);

      function getContactName(i) {
      if(i<report.length){
      filters_add.phone_number = report[i].incoming_phone_number ;
      app.db.models.addressBook.find(filters_add).lean().exec(function (err, contact) {
        console.log("i" + i);
        if(!err && contact.length > 0)
          incoming_phone_number = contact[0].name;
        else
          incoming_phone_number = report[i].incoming_phone_number;
         
          //incoming_phone_number = report[i].incoming_phone_number;i
        if(requestType != 'download'){
        resultList += '<tr><td style="width:22px"><label class="checkbox-inline"><input type="checkbox" name="id" value="'
        + report[i]._id+'"></label></td><td>';
         if(incoming_phone_number === report[i].incoming_phone_number)
            resultList += report[i].did_number + '</td><td>';
         else
            resultList += report[i].did_number + '</td><td>';
         resultList += incoming_phone_number + '</td><td>'
        + report[i].client_id + '</td><td>'
        + report[i].call_time + '</td><td>'
        + report[i].duration + '</td><td>'
        + report[i].no_of_pulse + '</td><td>'
        + report[i].hangup_cause + '</td></a></tr>';
        }
        else {
          resultList += incoming_phone_number +","+ report[i].did_number +","+ report[i].call_time  +","+ report[i].duration  +","+ report[i].no_of_pulse   +","+ report[i].hangup_cause+"\n";
        }
        getContactName(i+1);
       if(i === report.length -1){
          console.log("PAGINATION : " + page);
          resultList += "^"+page;
           res.write(resultList);
           res.end();
         }
       });
      }
      }
       if(report.length >0){
          getContactName(0);
       }   
       else{
          console.log("PAGINATION : " + page);
          resultList += "^"+page;
          res.write(resultList);
          res.end();
       }
    });
  }
  else{
    console.log("user is not authenticated");
    res.redirect('/login');
  }
});

app.router.get('/addressbook', function(skip,limit) {
  
  limit = this.req.query.limit ? parseInt(this.req.query.limit, null) : 20;
  skip = this.req.query.page ? parseInt(this.req.query.page, null) : 1;
  client_id = this.req.query.client_name ? this.req.query.client_name : '';
  did_number = this.req.query.did_number ? this.req.query.did_number : '';
  sort = this.req.query.sort ? this.req.query.sort : '_id';
  client_phone = '';
  if (!limit) {
      limit = 5;
  }
  if (!skip) {
      skip = 1;
  }
  nxt = skip+1;
  prev = skip - 1;
  if(prev < 1)
    prev = 1;

  app.log.info('did page');
  var res = this.res;
  var req = this.req;
 if (this.req.isAuthenticated()) {
    var filters = {};
    var filters_add = {};
    var filters_list = {};
    var roles = this.req.user.roles;
    var username = this.req.user.username;
    console.log(roles);
    if(roles == 'admin')
      filters.client_id = new RegExp('^.*?'+ client_id +'.*$', 'i');
    else
      filters.client_id = new RegExp('^.*?'+ req.user.username +'.*$', 'i');
      filters.did_number = new RegExp('^.*?'+ did_number +'.*$', 'i');

    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.call_detail.find().lean().skip((skip-1)*limit).limit(limit).sort(sort).exec(function (err, report) {
        console.log("report"+report);
      var resultList = '';
      var listResult= '';
      /*if(skip == 1 ){
         if(report.length !=  limit)
            page ='';
         else
            page = '<li><a href="/did?page='+nxt+'&limit='+limit+'&client_name='+client_name+'&did_number='+did_number+'&sort='+sort+'">Next</a></li>';
       }
      else if(report.length !=  limit)
         page = '<li><a href="/did?page='+prev+'&limit='+limit+'&client_name='+client_name+'&did_number='+did_number+'&sort='+sort+'">Previous</a></li>';
      else
         page = '<li><a href="/did?page='+prev+'&limit='+limit+'&client_name='+client_name+'&did_number='+did_number+'&sort='+sort+'">Previous</a></li><li><a href="/did?page='+nxt+'&limit='+limit+'&client_name='+client_name+'&did_number='+did_number+'&sort='+sort+'">Next</a></li>';
      for(var i=0;i<report.length;i++) {
      filters_add.client_id = new RegExp('^.*?'+ req.user.username +'.*$', 'i');
      filters_add.phone_number = new RegExp('^.*?'+ report[i].incoming_phone_number +'.*$', 'i');
      app.db.models.addressBook.find(filters_add).lean().exec(function (err, contact) {
        if(!err && contact.length > 0){
          incoming_phone_number = contact[0].name;
          incoming_phone_number = report[i].did_number;
         
        }
          incoming_phone_number = report[i].incoming_phone_number;
        resultList += '<tr><td style="width:22px"><label class="checkbox-inline"><input type="checkbox" name="id" value="'
        + report[i]._id+'"></label></td><td onclick="getTranscription('+report[i].incoming_phone_number+');">' 
        + report[i].did_number + '</td><td class="clickable" onclick="addContact('+report[i].incoming_phone_number+');">'
        + incoming_phone_number + '</td><td onclick="getTranscription('+report[i].incoming_phone_number+');">'
        + report[i].client_id + '</td><td onclick="getTranscription('+report[i].incoming_phone_number+');">'
        + report[i].call_time + '</td><td onclick="getTranscription('+report[i].incoming_phone_number+');">'
        + report[i].duration + '</td><td onclick="getTranscription('+report[i].incoming_phone_number+');">'
        + report[i].no_of_pulse + '</td><td onclick="getTranscription('+report[i].incoming_phone_number+');">'
        + report[i].hangup_cause + '</td></a></tr>'
       //});
     }
     */
    var all = "all"; 
    listResult +='<tr><td colspan="5" onclick="getContactsOfList(\''+all+'\');">All</td><td><a href="#" onClick="getDowloadList(\''+all+'\')"><img src="/img/download_small.gif" alt="download" style="height: 32px;width: 24px;"></a></td><td><a href="#" onClick="alert('+ "'Hello World!'"+')"><img src="/img/delete.png" alt="delete" style="height: 32px;width: 24px;"></a></td></tr>';
    if(roles != "admin") 
      filters_list.client_id = new RegExp('^.*?'+ req.user.username +'.*$', 'i');
    app.db.models.listAddressBook.find(filters_list).lean().exec(function (err,  list) {
      console.log(list);
      for(var i=0;i<list.length;i++) {
        listResult +='<tr><td colspan="5" onclick="getContactsOfList(\''+list[i].list_name+'\');">'+list[i].list_name+'</td><td><a href="#" onClick="getDowloadList(\''+list[i].list_name+'\')"><img src="/img/download_small.gif" alt="download" style="height: 32px;width: 24px;"></a></td><td><a href="#" onClick="alert('+ "'Hello World!'"+')"><img src="/img/delete.png" alt="delete" style="height: 32px;width: 24px;"></a></td></tr>';
      }
      console.log(listResult);
     // });
      res.write(plates.bind(Views.header, {'username':username}));
      res.write(plates.bind(Views.sidebar, {'alertMsg':alertMsg}));
      res.end(plates.bind(Views.addressbook, {'report':resultList,'username':username,'listAddress':listResult, 'alertMsg':alertMsg }));
      alertMsg='';
     });
    });
  }
  else{
    console.log("user is not authenticated");
    res.redirect('/login');
  }
});

app.router.get('/logout', function(){
  alertMsg = '';
  this.req.logout();
  this.res.redirect('/');
});
app.router.get('/checkSocket', function(){
  if (this.req.isAuthenticated()) {
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    this.res.end(plates.bind(Views.checkSocket, {'alertMsg':alertMsg}));
    alertMsg='';
  }
  else{
    console.log("user is not authenticated");
    this.res.redirect('/');
  }
  });


app.router.get('/changePassword', function () {
  if (this.req.isAuthenticated()) {
       var username = this.req.user.username;
       var userid = this.req.user._id;
       var res = this.res;
       this.res.writeHead(200, { 'Content-Type': 'text/html' });
       app.db.models.user.find({_id:userid},'_id').lean().exec(function (err, userobj) {
       var id = "<input type=hidden name='id' id='uid' value='"+userobj[0]._id+"'</input>";
       res.write(plates.bind(Views.header, {'username':username}));
       res.write(plates.bind(Views.sidebar, {'alertMsg':alertMsg}));
       res.end(plates.bind(Views.changePassword, {'_id':id, 'alertMsg':alertMsg,'username':username}));
       alertMsg='';
     });
  }
  else {
       app.log.info('login page');
       this.res.redirect('/login');
  }

  });

app.router.post('/changePassword', function() {
  var res = this.res;
  var id = this.req.body.id;
  var pwd = this.req.body.password;
  var encryptedPassword = app.db.models.user.encryptPassword(pwd);

  if (this.req.isAuthenticated()) {
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.user.update({_id: id}, {$set: {password : encryptedPassword}}, {upsert: true}).exec(function (err, userobj) {
    if(!err){
        alertMsg = '<div class="alert alert-success"><strong>Success ! </strong> User Password changed.</div>';
        res.redirect("/logout");
    }
    });
  }
  else{
    console.log("user is not authenticated");
    res.redirect('/changePassword');
  }
});


app.router.get('/changeSetting', function () {
  if (this.req.isAuthenticated()) {
       var username = this.req.user.username;
       var userid = this.req.user._id;
       var res = this.res;
       this.res.writeHead(200, { 'Content-Type': 'text/html' });
       app.db.models.user.find({_id:userid}).lean().exec(function (err, userobj) {
       var user = "<input type='text' class='form-control'name='username' value='"+userobj[0].username+"' readonly='true'>";
       var email = "<input type=text class='form-control' id='em' name='email' value='"+userobj[0].email+"'>";
       var address = "<input type=text class='form-control' id='em' name='address' value='"+userobj[0].address+"'>";
       var mobile = "<input type=text class='form-control' id='em' name='mobile' value='"+userobj[0].mobile+"'>";
       var id = "<input type=hidden name='id' id='uid' value='"+userobj[0]._id+"'</input>";
       res.write(plates.bind(Views.header, {'username':username}));
       res.write(plates.bind(Views.sidebar, {'alertMsg':alertMsg}));
       res.end(plates.bind(Views.changeSetting, {'userName':user, 'eml':email,'address': address,'mobile':mobile, '_id':id, 'alertMsg':alertMsg,'username':username}));
       alertMsg='';
     });
  }
  else {
       app.log.info('login page');
       this.res.redirect('/login');
  }
  });



app.router.post('/changeSetting', function() {
  var res = this.res;
  var emails = this.req.body.email;
  var address = this.req.body.address;
  var mobile = this.req.body.mobile;
  var id = this.req.body.id;
  if (this.req.isAuthenticated()) {
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    app.db.models.user.update({_id: id}, {$set: {email : emails, address : address, mobile : mobile}}, {upsert: true}).exec(function (err, userobj) {
    if(!err){
        alertMsg = '<div class="alert alert-success"><strong>Success ! </strong> User information changed.</div>';
        var redirectUrl = "/changeSetting";
        res.redirect(redirectUrl);
    }
    });
  }
  else{
    console.log("user is not authenticated");
    res.redirect('/');
  }
});

app.router.path('/demoAccount', function() {
  this.get(function() {
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    this.res.end(plates.bind(Views.demoAccount, {'alertMsg':alertMsg}));
    alertMsg='';
  });

  this.post(function() {
  console.log("user is added");
  var req = this.req;
  var res = this.res;
  var username = req.body.username;
  var address = req.body.address;
  var email = req.body.email;
  var mobile = req.body.mobile;
  var pwd = req.body.pwd;
  var role = 'user';
  var accountType = 'demo';
  var encryptedPassword = app.db.models.user.encryptPassword(pwd);
  console.log(encryptedPassword);
  console.log(app.config.get('ip_for_demo_ivr') + app.config.get('syncPort'));
  socket = '';
  socket = app.io_client.connect('http://'+app.config.get('ip_for_demo_ivr')+':'+app.config.get('syncPort'),{'force new connection': true});
  //console.log(socket.socket.connecting);
  //socket.socket.buffer =[];;
  //if(socket.socket.connecting){
  //console.log(socket);
              //socket.socket.connect();
           socket.emit('add user',{"username" : username, "address": address, "email" : email, "mobile" : mobile, "isActive" : true, "password" : encryptedPassword, "roles" : role, "accountType" : accountType});
           // Add a connect listener
           socket.on('connect', function(socket) {
           console.log('NMS Client Connected!');
           });
           app.db.models.user.create({"username" : username, "address": address, "email" : email, "mobile" : mobile, "isActive" : false, "password" : encryptedPassword, "roles" : role, "accountType" : accountType}, function (err, userobj) {
               if(!err){
          console.log(userobj);
          var url = "http://"+app.config.get('ip_for_demo_ivr')+":9090/activateMyAccount/"+userobj["_id"];
         console.log(url);
          mailOptions = {
                  from: "Deepak kumar<uneedtomailme@gmail.com>", // sender address
                  to: email, // list of receivers
                  subject: "Get Your Account Activated !!", // Subject line
                  text: "WELCOME...", // plaintext body
                  html: "<b><h1>Thankyou for the registeration !</h1></b><br><b>Please Click on the link given below to activate your account.</b><br><a href='"+url+"'>Get Your Account Activated</a><br>Username:"+username+"<br>Password:"+pwd // html body
                 }
         app.transport.sendMail(mailOptions, function(error, response){
           if(error){
                 console.log(error);
           }else{
              console.log("Message sent: " + response.message);
/*          var socket = app.io_client.connect('http://'+app.config.get('ip_for_demo_ivr')+':' + app.config.get('syncPort'), {'force new connection': true});
          var client_id = username +":"+app.config.get('did_for_demo_account') ;                                // Add a connect listener
          socket.emit('add account',{"client_id" : client_id, "total_credit" : 5, "credit_balance" : 5, 'pulse_rate': 60});
              socket.on('connect', function(socket) {
                 console.log('NMS Client Connected!');
              });
              socket.on('account added', function (data) {
                 app.db.models.account_detail.create({"client_id" : client_id, "total_credit" : 5, "credit_balance" : 5, 'pulse_rate': 60}, function (err, userobj) {
                    if(!err){
                        console.log(userobj);
                        alertMsg='<div class="alert alert-success"><strong>Success !</strong>Your Demo Account is created, please activate your account from the link sent to your registered email id </div>';
                        res.redirect('/login');
                        }
                    else{
                        console.log(err);
                        alertMsg='<div class="alert alert-danger"><strong>'+client_id+'</strong> Account is already present, please choose another .</div>';
                        console.log(userobj);
                        res.redirect('/login');
                        }
                      });
                  });*/
                        alertMsg='<div class="alert alert-success"><strong>Success !</strong>Your Demo Account is created, please activate your account from the link sent to your registered email id </div>';
                        res.redirect('/login');
           }
         });


               }
               else{
                   console.log(err);
                   alertMsg='<div class="alert alert-danger"><strong>'+username+'</strong> Username is already present, please choose another .</div>';
                   res.redirect('/demoAccount');
                   }
               });
           //});
                   /*socket.on('did not added', function (data){
                   app.db.models.user.find({username: username}).remove().exec(function (err, userobj) {
                    if(!err) {
                      alertMsg='<div class="alert alert-danger"><strong>'+username+'</strong> Username is already present, please choose another .</div>';
                      res.redirect('/demoAccount');
                    }
                    else{
                      console.log(err);
                      alertMsg='<div class="alert alert-danger"><strong>'+username+'</strong> Username is already present, please choose another .</div>';
                      res.redirect('/demoAccount');
                      }
                   });
                 });*/
           /*
           socket.on('connect_error', function (reason){
              console.error("connect_error");
           });
           socket.on('connect_timeout', function (reason){
              console.error("connect_timeout");
           });
           socket.on('reconnect', function (reason){
              console.error("reconnect");
           });
           socket.on('reconnect_error', function (reason){
              console.error("reconnect_error");
           });
           socket.on('reconnect_failed', function (reason){
              console.error("reconnect_failed");
           });*/
           socket.on('error', function (reason){
              if ( !socket ){
              console.error("unable to define");
               }
               else{
              console.error('Unable to connect Socket.IO', reason);
              alertMsg='<div class="alert alert-danger"><strong>Unable to connect with Server !</strong> Please try after some time  .</div>';
              res.redirect('/demoAccount');
               }
            });
           socket.on('disconnect', function (reason){
              //socket.destroy();
              console.error('Unable to connect Socket.IO', reason);
              alertMsg='<div class="alert alert-danger"><strong>Unable to connect with Server !</strong> Please try after some time  .</div>';
              res.redirect('/demoAccount');
            });
            /*}
               else{
              //console.log(socket);
              socket.disconnect("unauthorized");
              console.error('Unable to connect Socket.IO');
              alertMsg='<div class="alert alert-danger"><strong>Unable to connect with Server !</strong> Please try after some time  .</div>';
              res.redirect('/demoAccount');
               }*/
       });
 });


app.router.get('/demoDashboard', function() {
 if (this.req.isAuthenticated() && this.req.user.accountType == 'demo') {
    var username = this.req.user.username;
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    this.res.end(plates.bind(Views.demoDashboard, {'username':username}));
   }
  else{
    console.log("user is not authenticated");
    this.res.redirect('/');
   }
});

app.router.post('/virtualReceptionist',{stream : true}, function() {
  var req = this.req;
  var res = this.res;
  var sAlertMsg = '';
  var fAlertMsg = '';   
  var form = new formidable.IncomingForm(),
        files = [],
        fields = [],
        path = [],
        RemotePath =[];
    form.uploadDir = __dirname + app.config.get("localUploadDir");
    remoteUploadDir = app.config.get("remoteUploadDir");         
     form
     .on('field', function(field, value) {
       fields.push([field, value]);
     })
     .on('file', function(field, file) {
       files.push([field, file]);
        })
     .on('fileBegin', function(name, file) { 
       if(file.type == 'audio/mpeg' || file.type == 'audio/mp3' ){
       file.name = fields[0][1] + "_" + file.name;     
       file.path = form.uploadDir + "audio/" + file.name;
       remote_path = remoteUploadDir + "audio/" + file.name;   
       path.push([file.path, remote_path]);
       }
     })
     .on('progress', function(rec, expected) {
         //console.log("progress: " + rec + " of " +expected);
         //console.log('\nuploaded %s to %s',  files.image.filename, files.image.path);
       })
     .on('end', function() {
      
      
    console.log("fields :",fields); 
    console.log("files :",files);
    console.log("path :", path);
    console.log("path :", files[0][1].path);
   
    var did_number = fields[0][1];
    var noext = parseInt(fields[fields.length-1][1]); 
   
    app.db.models.did.find( { did_number : did_number }, ('ip_address ftp_username ftp_password')).exec(function (err, didobj){   
      if(!err)
      {
          ip_address = didobj[0].ip_address;
          ftp_username = didobj[0].ftp_username;
          ftp_password = didobj[0].ftp_password;
      }else
      {
          alertMsg = '<div class="alert alert-success"><strong>Fail ! </strong> Error fetching client info.</div>';
          res.redirect('/did/superReceptionist');
      }
       
    function createDbEntry(i,j)
    {
      if (j < fields.length - 2 )
      {
        extension = fields[2+i][1];
        phone = fields[2+j][1];
        console.log(extension + ":" + phone);
        require('./getRegion')(phone,app.db.models.region, function(err, region){
             if(!err)
      app.db.models.extension.create({"did" : did_number, "extension" : extension, "number" : phone, region : region}, function (err, extenobj) {
                  if(!err)
                  {
                  var socket = app.io_client.connect('http://'+ip_address+':' + app.config.get('syncPort'), {'force new connection': true});
                  // Add a connect listener
                  socket.on('connect', function(socket) {
                      console.log('Connected to remote host');
                      });
                  socket.emit('add extension',{_id: extenobj._id , did : did_number, extension: extension, number : phone, region : region });   
                  socket.on('extension added', function (data) {
                    //alertMsg = '<div class="alert alert-success"><strong>Success ! </strong> Extension information changed.</div>';
                    console.log('One extension is updated on remote database');
                  });
                  socket.on('extension not added', function (data) {
                    alertMsg = '<div class="alert alert-danger"><strong>Inconsistent Database! </strong> Extension information not updated on remote server.</div>';
                  }); 
                  }
                createDbEntry(i+2,j+2);
            });
            });
           
      }
     
    }
   
    createDbEntry(0,1);
    alertMsg = '<div class="alert alert-success"><strong>Success! </strong> Virtual Receptionist is created successfully.</div>';
    console.log("All extension updated on local and remote Server");
    console.log("Fields [1][1] : " + fields[1][1]);
    if (path.length != 0 || fields[1][1] != '' )
    {
        if ( fields[1][1] != '' )
        {
            console.log("ha gya mein yha");
            app.db.models.welcomeDid.create({ did : did_number, type : "text", response : fields[1][1] }, function(err,welcObj){
                if (! err)
                {
                  console.log("Welcome msg is added in local Database");
                  console.log("Trying to connect to remote database...");
                  var socket = app.io_client.connect('http://'+ip_address+':' + app.config.get('syncPort'), {'force new connection': true});
                      // Add a connect listener
                          socket.on('connect', function(socket) {
                          console.log('Connected to remote host');
                          });
                          socket.emit('add welcomeMsg',{_id: welcObj._id , did : welcObj.did, type :"text" , response : welcObj.response });   
                          socket.on('welcomeMsg added', function (data) {
                  console.log("Welcome msg is updated on remote database");
                          });
                          socket.on('extension not added', function (data) {
                        console.log("Error adding welcome msg on remote Database")
                          }); 
                }
                else
                {
                console.log('Already have welcome msg for Given did');
                alertMsg = '<div class="alert alert-success"><strong>Fail ! </strong> Already have welcome entry for given Did</div>';
                res.redirect("/extension");
                }
            });
        }
        else
        {
          require('./ftp')(path[0][0] , path[0][1] ,ip_address , ftp_username ,ftp_password , function(err, data){
            if (! err)
            {
                  app.db.models.welcomeDid.create({ did : did_number, type : "audio", response : fields[1][1] }, function(err,welcObj){
                  if (! err)
                  {
            console.log("Welcome msg is added in local Database");
            var socket = app.io_client.connect('http://'+ip_address+':' + app.config.get('syncPort'), {'force new connection': true});
                        // Add a connect listener
                        socket.on('connect', function(socket) {
                            console.log('Connected to remote host');
                            });
                        socket.emit('add welcomeMsg',{_id: welcObj._id , did : welcObj.did, type :"text" , response : path[0][1] });   
                        socket.on('welcomeMsg added', function (data) {
                console.log("Welcome msg is updated on remote database");
                 });
                        
                        socket.on('welcomeMsg not added', function (data) {
                console.log("Error adding welcome msg on remote Database")
                        });
          }
          else
                  {
            console.log('Already have welcome msg for Given did');
                  }
          });
              }
              else
          {
        alertMsg = '<div class="alert alert-danger"><strong>Fail ! </strong> Error sending welcome audio to remote server</div>';
        res.redirect("/extension");
          }
          
            });
        }
    }
    
    
      if(!(fs.existsSync(form.uploadDir + 'xml/'+ ip_address + '.xml')))
      {
      var xmlToInsert = "<include><context name=\"default\" ><extension name = \"default\" continue=\"true\"/></context></include>";
      fs.writeFileSync(form.uploadDir + '/xml/'+ ip_address + '.xml',xmlToInsert);
      }
      
      var expressionValue = fields[0][1]; //no to insert(value of expression field)
      var scriptPath = app.config.get("virtualReceptionistScript");
      var filePath = form.uploadDir + 'xml/'+ ip_address + '.xml';                
      var xmlToInsert = "<condition field = \"destination_number\" expression = \"" +expressionValue +"\"><action application=\"lua\" data=\""+scriptPath + "\"/> </condition>";    
      require('./dialplan')(filePath,expressionValue,scriptPath,function(){
      if (err)
          console.log('error creating file');
      else
      {    
          var remoteDialplanDir = app.config.get("remoteDialplanDir");
          var remote_dialplan_path = remoteDialplanDir + app.config.get("remoteDialplanName"); 
          require('./ftp')(form.uploadDir + "xml/"+ ip_address + ".xml",remote_dialplan_path,ip_address, ftp_username,ftp_password,function(err, data){
              conn = new esl.Connection(ip_address, 8021, 'ClueCon', function() {
                  conn.api('reloadxml', function(res) {
                      console.log(res.getBody());
                  });
              });       
        });
      }    
    });   
   });
    
   
      res.redirect('/virtualReceptionist');
  });   
  
     form.parse(req);
     req.buffer=false;

  });

app.router.post('/allocateDidForVR',{stream : true}, function() {
   var req = this.req;
   var res = this.res;
   var client_name = req.body.client_name;
   var did_number = req.body.did_number;
   var ip_address = req.body.ip_address;
   var ftp_username = req.body.ftp_user_name;
   var ftp_password = req.body.ftp_password;
   var client_contact_phone = req.body.contact_phone;
   console.log(client_name + client_address + client_email+client_phone_number+client_contact_person+client_contact_phone);
   if (this.req.isAuthenticated()) {
       this.res.writeHead(200, { 'Content-Type': 'text/html' });
       app.db.models.did.create({"client_name" : client_name,"did_number": did_number, "ip_address" : ip_address, "ftp_username" : ftp_username, "ftp_password" : ftp_password}, function (err, virtualr) {
          if(!err){
            console.log(virtualr);
            alertMsg='<div class="alert alert-success"><strong>Success !</strong> New Client :'+client_name+' is added.</div>';
            res.redirect('/did/SuperReceptionist');
           }
          else{
            console.log(err);
            alertMsg='<div class="alert alert-danger"><strong>'+client_name+'</strong> Client name is already present, please choose another .</div>';
            res.redirect('/allocateDidForVR');
           }
          });
        }
   else{
       console.log("user is not authenticated");
       res.redirect('/');
   }
  });
app.router.path('/allocateDidForVR', function() {
  this.get(function() {
    if (this.req.isAuthenticated() && this.req.user.roles === "admin") {
      var username = this.req.user.username;
      var res = this.res;
      var filters = {};
      var resultList ="";
      filters.roles = new RegExp('^.*?'+ 'user' +'.*$', 'i');
      app.db.models.user.find(filters,'username').lean().exec(function (err, client) {
         console.log(client);
         for(var i=0;i<client.length;i++) {
             console.log(client[i].username);
             resultList += '<option value ="'+client[i].username+'">'+client[i].username+'</option>';
         }
         res.writeHead(200, { 'Content-Type': 'text/html' });
         res.write(plates.bind(Views.header, {'username':username}));
         res.write(plates.bind(Views.sidebar, {'alertMsg':alertMsg}));
         res.end(plates.bind(Views.allocateDidForVR, {'client_name': resultList, 'alertMsg':alertMsg}));
         alertMsg='';
      });
      }
    else{
        console.log("user is not authenticated");
        this.res.redirect('/');
    }
   });
});

app.router.get('/black_white_list', function () {
  var res = this.res;
  if (this.req.isAuthenticated()) {
    var filters = {};

    var username = this.req.user.username;
    var didList ='';
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
     if(this.req.user.roles != 'admin')
     {
      filters.client_name =  this.req.user.username ;
      }
    app.db.models.did.find(filters,'did_number ip_address').lean().exec(function (err, did) {
      console.log(did);
      for(var i=0;i<did.length;i++) {
        if(i==0)
             didList += '<option value =""></option>';
         didList += '<option value ="'+did[i].did_number+":"+did[i].ip_address+'">'+did[i].did_number+'</option>';
         console.log(didList);
       }
      res.write(plates.bind(Views.header, {'username':username}));
      res.write(plates.bind(Views.sidebar, {'alertMsg':alertMsg}));
     res.end(plates.bind(Views.createBWList, {'didList': didList, 'alertMsg': alertMsg,'username':username}));
     alertMsg='';
     });
  }
  else{
    console.log("user is not authenticated");
    this.res.redirect('/');
  }
});

app.router.post('/createblackwhitelist', function (){
 console.log("welcome");
  if (this.req.isAuthenticated()) {
     var res = this.res;
     var listType = this.req.body.listType;
     var did = this.req.body.did;
     var ip_address = this.req.body.ip_address;
     if(listType === 'blackList')
        var isblist = true;
     else
        var isblist = false;
     console.log(ip_address);
     res.writeHead(200, { 'Content-Type': 'text/html' });
     app.db.models.didBlacklist.create({"did_number" : did, "isBlacklist": isblist }, function (err, rslt) {
     if(!err){
       var socket = app.io_client.connect('http://'+ip_address+':' + app.config.get('syncPort'), {'force new connection': true});
       // Add a connect listener
       socket.emit('create blackWhiteList',rslt);
       socket.on('connect', function(socket) {
          console.log('NMS Black White list Connected!');
       });
       res.write("DONE");
     }
     else
       res.write("NOT DONE");
     res.end();
     });
  }
  else{
    console.log("user is not authenticated");
     res.write("NOT DONE");
     res.end();
  }
});

app.router.post('/getBWList', function (){
 console.log("welcome");
  if (this.req.isAuthenticated()) {
     var res = this.res;
     var did = this.req.body.did;
     var filters = {};
     filters.did_number = did; 
     console.log(did);
     res.writeHead(200, { 'Content-Type': 'text/html' });
     app.db.models.didBlacklist.find(filters).lean().exec(function (err, rslt){ 
     if(!err && rslt.length>0)
       res.write("CREATED");
     else
       res.write("NOT");
     res.end();
     });
  }
  else{
    console.log("user is not authenticated");
     res.write("NOT DONE");
     res.end();
  }
});
app.router.post('/getBWlist_did', function (){
 console.log("welcome");
  var res = this.res;
  if (this.req.isAuthenticated()) {
     var did = this.req.body.did;
     var filters = {};
     var listType = 'BlackList';
     var resultList = '';
     filters.did_number = did;
     console.log(did);
     res.writeHead(200, { 'Content-Type': 'text/html' });
     app.db.models.didBlacklist.find(filters,'isBlacklist').lean().exec(function (err, isblist){ 
     console.log(JSON.stringify(isblist));
     app.db.models.blacklist.find(filters).lean().exec(function (err, rslt){
     if(!err && rslt.length>0){
        if(!rslt[0].isBlacklist)
           listType = 'WhiteList';
        for(var i = 0; i<rslt.length; i++){
              resultList += '<tr><td style="width:22px"><label class="checkbox-inline"><input type="checkbox" name="id" value="'
        + rslt[i]._id+'"></label></td><td>' 
        + rslt[i].did_number + '</td><td>'
        + rslt[i].phone_number + '</td></tr>';

        }
        res.write(resultList+"@"+listType);
     }
     else
       res.write("NOT DATA IS AVAILABLE !!");
     res.end();
     });
     });
  }
  else{
    console.log("user is not authenticated");
     res.write("NOT DONE");
     res.end();
  }
});


app.router.post('/addIntoBWlist', function (){
  if (this.req.isAuthenticated()) {
     var res = this.res;
     var did = this.req.body.did;
     var ip_address = this.req.body.ip_address;
     console.log(ip_address);
     var phone = this.req.body.phone_number;
     var filters = {};
     filters.did_number = did; 
     console.log(did);
     res.writeHead(200, { 'Content-Type': 'text/html' });
     app.db.models.blacklist.create({"did_number" : did, "phone_number": phone }, function (err, rslt) {
     if(!err){
       var socket = app.io_client.connect('http://'+ip_address+':' + app.config.get('syncPort'), {'force new connection': true});
       // Add a connect listener           
       socket.emit('add blackWhiteList',rslt);
       socket.on('connect', function(socket) {
          console.log('NMS Black White list Connected!');
       });
       res.write("CREATED");
     }
     else
       res.write("NOT");
     res.end();
     });
  }
  else{
    console.log("user is not authenticated");
     res.write("NOT DONE");
     res.end();
  }
});

app.router.get('/play', function () {
var filePath = '/usr/share/freeswitch/voicemail/662c2012-cfb9-4c3d-8484-b2599740abb4.wav';
var stat = fs.statSync(filePath);
var res = this.res;
this.res.writeHead(200, {
'Content-Type': 'audio/mpeg',
'Content-Length': stat.size
});
var readStream = fs.createReadStream(filePath);
readStream.on('data', function(data) {
res.write(data);
});

readStream.on('end', function() {
res.end();
});
});

app.router.get('/missedCall', function () {
  var res = this.res;
  if (this.req.isAuthenticated()) {
    var filters = {};

    var username = this.req.user.username;
    var didList ='';
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
     if(this.req.user.roles != 'admin')
     {
      filters.client_name =  this.req.user.username;
      }
    app.db.models.did.find(filters,'did_number ip_address').lean().exec(function (err, did) {
      console.log(did);
      for(var i=0;i<did.length;i++) {
        if(i==0)
             didList += '<option value =""></option>';
         didList += '<option value ="'+did[i].did_number+":"+did[i].ip_address+'">'+did[i].did_number+'</option>';
         console.log(didList);
       }
      res.write(plates.bind(Views.header, {'username':username}));
      res.write(plates.bind(Views.sidebar, {'alertMsg':alertMsg}));
     res.end(plates.bind(Views.missedCall, {'didList': didList, 'alertMsg': alertMsg,'username':username}));
     alertMsg='';
     });
  }
  else{
    console.log("user is not authenticated");
    this.res.redirect('/');
  }
});

app.router.post('/createMissedCallApp', function (){
  if (this.req.isAuthenticated()) {
     var res = this.res;
     var did = this.req.body.did;
     var ip_address = this.req.body.ip_address;
     console.log("DID+ IP : "+did + ip_address);
           var socket = app.io_client.connect('http://'+ip_address+':' + app.config.get('syncPort'), {'force new connection': true});
           socket.emit('update did missedCall',{"did_number" : did});
           // Add a connect listener
           socket.on('connect', function(socket) {
                 app.db.models.did.update({did_number : did},{$set : {app_name : "missedCall" }} , function (err, clientobj) {
                   if(!err){
                      console.log('Connected to remote host');
	              if(!(fs.existsSync( __dirname + '/upload/xml/'+ ip_address + '.xml')))
	              {
		         var xmlToInsert = "<include><context name=\"default\" ><extension name = \"default\" continue=\"true\"/></context></include>";
		         fs.writeFileSync(__dirname + '/upload/xml/'+ ip_address + '.xml',xmlToInsert);
	              }

	              var expressionValue = did; //no to insert(value of expression field)
	              var scriptPath = app.config.get("missedCallScript");
	              var filePath = __dirname + '/upload/xml/' + ip_address + '.xml';	
	              var xmlToInsert = "<condition field = \"destination_number\" expression = \"" +expressionValue +"\"><action application=\"lua\" data=\""+scriptPath + "\"/> </condition>";	
	              require('./dialplan')(filePath,expressionValue,scriptPath,function(){
	              /*if (err)
	                 console.log('error creating file');
	                else*/
	              {	
		          var remoteDialplanDir = app.config.get("remoteDialplanDir");
		          var remote_dialplan_path = remoteDialplanDir + app.config.get("remoteDialplanName"); 
		          require('./ftp')( __dirname + '/upload/xml/' + ip_address + ".xml",remote_dialplan_path,ip_address, app.config.get('ftp_username_demo_ivr'),app.config.get('ftp_pwd_demo_ivr'),function(err, data){
		          conn = new esl.Connection(ip_address, 8021, 'ClueCon', function() {
		             conn.api('reloadxml', function(result) {
		               console.log(result.getBody());
                               res.write("DONE");
                               res.end();
	                     });
	                  }); 
	                });
	              } 
	             });
	          }
                  else{
                     console.log(err);
                     alertMsg="<div class='alert alert-danger'><strong> Sorry !</strong> Couldn't complete your request .</div>";
                     res.redirect('/createMissedCallApp');
                  } 

               });
             });
             socket.on('error', function (reason){
                     console.error('Unable to connect Socket.IO', reason);
                     alertMsg="<div class='alert alert-danger'><strong> Sorry !</strong> Couldn't connect to the calling server, please try after some time. </div>";
                     res.redirect('/createMissedCallApp');
             });
   }
   else{
    console.log("user is not authenticated");
    this.res.redirect('/');
  }
});

app.router.get('/stickyAgent', function () {
  var res = this.res;
  if (this.req.isAuthenticated()) {
    var filters = {};

    var username = this.req.user.username;
    var didList ='';
    this.res.writeHead(200, { 'Content-Type': 'text/html' });
     if(this.req.user.roles != 'admin')
     {
      filters.client_name =  this.req.user.username;
      }
    app.db.models.did.find(filters,'did_number ip_address').lean().exec(function (err, did) {
      console.log(did);
      for(var i=0;i<did.length;i++) {
        if(i==0)
             didList += '<option value =""></option>';
         didList += '<option value ="'+did[i].did_number+":"+did[i].ip_address+'">'+did[i].did_number+'</option>';
         console.log(didList);
       }
      res.write(plates.bind(Views.header, {'username':username}));
      res.write(plates.bind(Views.sidebar, {'alertMsg':alertMsg}));
     res.end(plates.bind(Views.stickyAgent, {'didList': didList, 'alertMsg': alertMsg,'username':username}));
     alertMsg='';
     });
  }
  else{
    console.log("user is not authenticated");
    this.res.redirect('/');
  }
});


app.router.post('/showStickyAgent', function (){
  if (this.req.isAuthenticated()) {
     var res = this.res;
     var did = this.req.body.did;
     var ip_address = this.req.body.ip_address;
     console.log(ip_address);
     var filters = {};
     var resultList ='';
     filters.did_number = did;
     console.log(did);
     res.writeHead(200, { 'Content-Type': 'text/html' });
     app.db.models.stickyAgent.find(filters).lean().exec(function (err, rslt){
     if(!err && rslt.length>0){
        for(var i = 0; i<rslt.length; i++){
              resultList += '<tr class="clickableRow" onclick="editStickyAgent('+"'"+rslt[i].incoming_phone_number+"','"+rslt[i].forwarding_phone_number+"'"+')"><td style="width:22px"><label class="checkbox-inline"><input type="checkbox" name="id" value="'
        + rslt[i]._id+'"></label></td><td>'
        + rslt[i].incoming_phone_number + '</td><td>'
        + rslt[i].forwarding_phone_number + '</td></tr>';
         }
           res.write(resultList);
        }
        else
          res.write("<tr><td></td><td>NO DATA IS AVAILABLE !!</td><td></td></tr>");
        res.end();
        });
    } 
 else{
    console.log("user is not authenticated");
     res.write("NOT DONE");
     res.end();
  }
});

app.router.post('/addStickyAgent', function (){
  if (this.req.isAuthenticated()) {
     var res = this.res;
     var did = this.req.body.did;
     var ip_address = this.req.body.ip_address;
     var incoming_phone_number = this.req.body.incoming_phone_number;
     var forwarding_phone_number = this.req.body.forwarding_phone_number;
     console.log(ip_address+ forwarding_phone_number + incoming_phone_number);
     var filters = {};
     filters.did_number = did;
     console.log(did+incoming_phone_number+forwarding_phone_number);
     res.writeHead(200, { 'Content-Type': 'text/html' });
       var socket = app.io_client.connect('http://'+ip_address+':' + app.config.get('syncPort'), {'force new connection': true});
       // Add a connect listener           
       socket.emit('add stickyAgent',{"did_number" : did, "incoming_phone_number": incoming_phone_number, "forwarding_phone_number": forwarding_phone_number });
       socket.on('connect', function(socket) {
           app.db.models.stickyAgent.create({"did_number" : did, "incoming_phone_number": incoming_phone_number, "forwarding_phone_number": forwarding_phone_number }, function (err, rslt) {
               if(!err){
                   console.log('NMS Sticky Agent  Connected!');
                   res.write("CREATED");
               }
               else
                 res.write("NOT");
               res.end();
           });
       });
       socket.on('error', function(reason){
            console.error('Unable to connect Socket.IO', reason);
            res.write("NO CONNECTION");
            res.end();
       });
     }
  else{
     console.log("user is not authenticated");
     res.write("NOT DONE");
     res.end();
     }
});

app.router.post('/saveStickyAgent', function (){
  if (this.req.isAuthenticated()) {
     console.log("SaveSticky Agents");
     var res = this.res;
     var did = this.req.body.did;
     var ip_address = this.req.body.ip_address;
     var incoming_phone_number = this.req.body.incoming_phone_number;
     var forwarding_phone_number = this.req.body.forwarding_phone_number;
     var hosting = this.req.body.hosting;
     console.log(ip_address+ forwarding_phone_number + incoming_phone_number+hosting);
     var filters = {};
     filters.did_number = did;
     console.log(did+incoming_phone_number+forwarding_phone_number);
     res.writeHead(200, { 'Content-Type': 'text/html' });
       var socket = app.io_client.connect('http://'+ip_address+':' + app.config.get('syncPort'), {'force new connection': true});
       // Add a connect listener           
       socket.emit('save stickyAgent',{"did_number" : did, "incoming_phone_number": incoming_phone_number, "forwarding_phone_number": forwarding_phone_number , "hosting" : hosting});
       socket.on('connect', function(socket) {
           app.db.models.stickyAgent.update({incoming_phone_number: hosting, did_number: did}, {$set: {incoming_phone_number: incoming_phone_number, forwarding_phone_number: forwarding_phone_number}}, {upsert: true}).exec(function (err, userobj) {
               if(!err){
                   console.log('NMS Sticky Agent  Connected!');
                   res.write("CREATED");
               }
               else
                 res.write("NOT");
            res.end();
           });
       });
       socket.on('error', function(reason){
            console.error('Unable to connect Socket.IO', reason);
            res.write("NO CONNECTION");
            res.end();
       });
     }
  else{
     console.log("user is not authenticated");
     res.write("NOT DONE");
     res.end();
     }
});

} //export ends here

