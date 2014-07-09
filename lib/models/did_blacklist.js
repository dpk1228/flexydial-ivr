'use strict';

exports = module.exports = function(app, mongoose) {
  var didBlacklist = new mongoose.Schema({
    did_number: {type: String, unique: true},
    isBlacklist: { type: Boolean,default : true},
    timeCreated: { type: Date, default: Date.now },
    timeModified: { type: Date },
  });



  didBlacklist.index({ did_number: 1 }, {unique: true});
  didBlacklist.index({ isBlacklist: 1 });
  didBlacklist.index({ timeModified: 1 });
  app.db.model('didBlacklist', didBlacklist);
};

