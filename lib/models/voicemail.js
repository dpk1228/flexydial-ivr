'use strict';

exports = module.exports = function(app, mongoose) {
  var voicemailSchema = new mongoose.Schema({
    _id: {type: String, unique: true},
    did_number: String,
    call_to_number: String,
    client_id: String,
    duration: String,
    incoming_phone_number: String,
    call_time: String,
    flag: Number,
    timeCreated: { type: Date, default: Date.now },
    timeModified: { type: Date },
  });



  voicemailSchema.index({ _id: 1 }, {unique: true});
  voicemailSchema.index({ did_number: 1 });
  voicemailSchema.index({ call_to_number: 1 });
  voicemailSchema.index({ client_id: 1 });
  voicemailSchema.index({ duration: 1 });
  voicemailSchema.index({ incoming_phone_number: 1 });
  voicemailSchema.index({ call_time: 1 });
  voicemailSchema.index({ flag: 1 });
  voicemailSchema.index({ timeModified: 1 });
  app.db.model('voicemail', voicemailSchema);
};
