function getRegion(phone_number,db, callback){
   var num = parseInt(phone_number.slice(0,5));
   db.find({to : {$lte : num},from : {$gte : num}}).lean().exec(function (err, region){
     if(!err){
       callback(null, (region[0].region));
    }
    else
       callback(true, null);
   });

 }


module.exports = getRegion

