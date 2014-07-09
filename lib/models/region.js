'use strict';

exports = module.exports = function(app, mongoose) {
  var region = new mongoose.Schema({
    to: Number,
    from: Number,
    region: String,
    service_provider: String,
    timeCreated: { type: Date, default: Date.now },
    timeModified: { type: Date },
  });



  region.index({ to: 1 });
  region.index({ from: 1 });
  region.index({ region: 1 });
  region.index({ timeModified: 1 });
  app.db.model('region', region);
};

