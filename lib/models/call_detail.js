'use strict';

exports = module.exports = function(app, mongoose) {
  var reportSchema = new mongoose.Schema({
    _id: {type: String, unique: true},
    bridged_id: String,
    did_number: String,
    client_id: String,
    duration: String,
    bridged_duration: String,
    no_of_pulse: Number,
    hangup_cause: String,
    bridged_hangup_cause: String,
    incoming_phone_number: String,
    bridged_to: String,
    wait_by_fs: String,
    time_to_answer: String,
    call_time: String,
    bridged_call_time: String,
    flag: String,
    timeCreated: { type: Date, default: Date.now },
    timeModified: { type: Date },
  });



  reportSchema.index({ _id: 1 }, {unique: true});
  reportSchema.index({ bridged_id: 1 }, {unique: true});
  reportSchema.index({ did_number: 1 });
  reportSchema.index({ client_id: 1 });
  reportSchema.index({ duration: 1 });
  reportSchema.index({ no_of_pulse: 1 });
  reportSchema.index({ hangup_cause: 1 });
  reportSchema.index({ incoming_phone_number: 1 });
  reportSchema.index({ wait_by_fs: 1 });
  reportSchema.index({ time_to_answer: 1 });
  reportSchema.index({ call_time: 1 });
  reportSchema.index({ flag: 1 });
  reportSchema.index({ timeModified: 1 });
  app.db.model('call_detail', reportSchema);
};
