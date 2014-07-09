'use strict';

exports = module.exports = function(app, mongoose) {
  var addressBookSchema = new mongoose.Schema({
    client_id: String,
    name : String,
    company: String,
    phone_number : String,
    email: String,
    list_name: String,
    timeCreated: { type: Date, default: Date.now },
  });

  addressBookSchema.index({ client_id: 1, phone_number: 1 }, {unique: true});
  addressBookSchema.index({ phone_number: 1 });
  addressBookSchema.index({ email: 1 });
  addressBookSchema.index({ company: 1 });
  app.db.model('addressBook', addressBookSchema);
  
};
 
