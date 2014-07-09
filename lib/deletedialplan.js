xml2js = require ('xml2js');
fs = require('fs');

//filePath ="/etc/freeswitch/vanilla/dialplan/MyDialplan1.xml";
//expressionValue="9000";
  
var deleteDialplanEntry = function deleteDialplanEntry(filePath,expressionValue,callback){
if (filePath!='' || filePath == '' || expressionValue == '' || expressionValue == null ) 
{
  callback("No proper arguments, Dialplan is not updated");
}
else
{  
var parser = new xml2js.Parser({ explicitRoot : false , normailzeTags : true});
fs.readFile(filePath,function (err,data){
	parser.parseString(data,function(err,result){
		var parentNode;
		if (err)
		{
			console.log(err.toSting());
			return ;
		}
		var jsonArray = [];
		for (var i in result)   
		{
		  jsonArray.push([i,result[i]]);
		}
		var entryFound = false;
		for(var i = 0; i < (jsonArray[0][1])[0].extension.length ; i++)
		{
		  console.log((jsonArray[0][1])[0].extension[i].$.name);
		  if ((jsonArray[0][1])[0].extension[i].$.name == expressionValue)
		  {
		    (jsonArray[0][1])[0].extension.splice(i,1);
		    entryFound = true;
		  }
		  
		}
		if (entryFound)
		{  
		  
		      tempStr = JSON.stringify(jsonArray);
		      var str2 ='{"context":' + tempStr.substring(12,tempStr.length-2) + '}'; 
		      JSONobj = JSON.parse(str2);
		      var builder = new xml2js.Builder({rootName : "include"});
		      var xml = builder.buildObject(JSONobj);
		      console.log(xml);
		      fs.writeFile(filePath, xml , function(err) {
			  if(err) {
			      console.log(err);
			  }else{
			      console.log("Dialplan has been updated");
			      callback();
			   }
		      }); 
	  
		}
		else{
		  console.log("Entry not found, Dialplpan is Intact");
		  callback(expressionValue + " not found");
		}
	});
  });
}

}
module.exports = deleteDialplanEntry ; 
 
