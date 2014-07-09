xml2js = require ('xml2js');
fs = require('fs');

var addDialplanEntry = function addDialplanEntry(filePath,expressionValue,scriptPath,callback)
{
if ( filePath == null || filePath == '' || expressionValue == null || scriptPath == "" || scriptPath == null)
{
  console.log("No proper arguments, Dialplan is not updated");
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
		
		var xmlToInsert = "<extension name=\""+ expressionValue +"\"><condition field = \"destination_number\" expression = \"^" +expressionValue +"$\"><action application=\"lua\" data=\""+scriptPath + "\"/> </condition> </extension>";
						parser.parseString(xmlToInsert, function (err, data){
						if (err)
						{
						  console.log("Invalid syntex :" + err);
						}else {
							  (jsonArray[0][1])[0].extension.push(data);	
							  tempStr = JSON.stringify(jsonArray);
							  var str2 ='{"context":' + tempStr.substring(12,tempStr.length-2) + '}'; 
							  JSONobj = JSON.parse(str2);
							  var builder = new xml2js.Builder({rootName : "include"});
							  var xml = builder.buildObject(JSONobj);
							  //console.log(xml);
							  fs.writeFile(filePath, xml , function(err) {
								if(err) {
								    console.log(err);
								} else {
								    console.log("Dialplan has been updated");
								    callback();
								}
							  }); 
						}
						});
	});
});
}
}

module.exports = addDialplanEntry ;