'use strict';

exports = module.exports = function(app, mongoose) {
  var extensionSchema = new mongoose.Schema({
    did: String ,
    extension: String,
    number: String,
    region: String,
    timeCreated: { type: Date, default: Date.now },
  });

  extensionSchema.index({ did: 1, extension: 1 }, {unique: true});
  extensionSchema.index({ extension : 1 });
  extensionSchema.index({ number : 1 });
  extensionSchema.index({ region : 1 });
  extensionSchema.index({ timeCreated: 1 });
  app.db.model('extension', extensionSchema);
};
 
