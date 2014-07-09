

function sendFtp(localPath, remotePath, ip , userName, password,callback) {
fs = require ("fs");  
jsftp = require('jsftp');
 fs.chmodSync(localPath,'644');
 console.log("Permission of " + localPath + " is changed to 644");

  var Ftp = new jsftp({
      host: ip,
      port: 21,
      user: userName,
      pass: password
    });
    var local = localPath;
    var remote = remotePath;
    fs.readFile(local, function(err, buffer) {
      if(err) {
        console.error("Error reading local file : " + err);
        //callback(err);
      }
      else {
	 console.log("Sending " + localPath + " to "+ remote);
         Ftp.put(buffer, remote, function(err) {
          if (err) {
            console.error("Error sending file to remote Server : " +err);
            //callback(err);
          }
          else {
            console.log(" - uploaded successfuly at " + remotePath);
            callback(null,"Done");
          }
        });
      }
    });
  }

module.exports = sendFtp 
