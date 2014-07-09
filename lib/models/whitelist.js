'use strict';

exports = module.exports = function(app, mongoose) {
  var whitelist = new mongoose.Schema({
    phone_number: String,
    did_number: String,
    flag: { type: Number,default : 0},
    timeCreated: { type: Date, default: Date.now },
    timeModified: { type: Date },
  });



  whitelist.index({ did_number: 1,phone_number: 1 }, {unique: true});
  whitelist.index({ isBlacklist: 1 });
  whitelist.index({ timeModified: 1 });
  app.db.model('whitelist', whitelist);
};

