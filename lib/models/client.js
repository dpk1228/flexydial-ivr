'use strict';

exports = module.exports = function(app, mongoose) {
  var clientSchema = new mongoose.Schema({
    client_name: {type: String, unique: true},
    client_address: String,
    client_email: String,
    client_phone_number: String,
    client_contact_person: String,
    client_contact_phone: String,
    isActive: {type: Boolean, default: true},
    timeCreated: { type: Date, default: Date.now },
    timeModified: { type: Date },
  });



  clientSchema.index({ client_name: 1 }, {unique: true});
  clientSchema.index({ client_address: 1 });
  clientSchema.index({ client_email: 1 });
  clientSchema.index({ client_phone_number: 1 });
  clientSchema.index({ client_contact_person: 1 });
  clientSchema.index({ client_contact_phone: 1 });
  clientSchema.index({ timeCreated: 1 });
  clientSchema.index({ timeModified: 1 });
  app.db.model('client', clientSchema);
};
