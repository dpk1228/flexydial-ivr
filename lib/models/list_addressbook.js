'use strict';

exports = module.exports = function(app, mongoose) {
  var listAddressBookSchema = new mongoose.Schema({
    client_id: String,
    list_name : String,
    timeCreated: { type: Date, default: Date.now },
  });

  listAddressBookSchema.index({ client_id: 1, list_name: 1 }, {unique: true});
  app.db.model('listAddressBook', listAddressBookSchema);
  
};
 
