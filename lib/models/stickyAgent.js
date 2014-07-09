'use strict';

exports = module.exports = function(app, mongoose) {
  var stickyAgent = new mongoose.Schema({
    incoming_phone_number: String,
    forwarding_phone_number: String,
    did_number: String,
    flag: { type: Number,default : 0},
    timeCreated: { type: Date, default: Date.now },
    timeModified: { type: Date },
  });



  stickyAgent.index({ did_number: 1,incoming_phone_number: 1 }, {unique: true});
  stickyAgent.index({ timeModified: 1 });
  app.db.model('stickyAgent', stickyAgent);
};

