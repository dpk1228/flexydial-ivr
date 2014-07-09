'use strict';

exports = module.exports = function(app, mongoose) {
  var blacklist = new mongoose.Schema({
    phone_number: String,
    did_number: String,
    flag: { type: Number,default : 0},
    timeCreated: { type: Date, default: Date.now },
    timeModified: { type: Date },
  });



  blacklist.index({ did_number: 1,phone_number: 1 }, {unique: true});
  blacklist.index({ timeModified: 1 });
  app.db.model('blacklist', blacklist);
};

