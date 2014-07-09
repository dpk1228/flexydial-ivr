
'use strict';

exports = module.exports = function(app, mongoose) {
var welcomeDidSchema = new mongoose.Schema({
did: String ,
type : String,
response : String,
timeCreated: { type: Date, default: Date.now },
});

welcomeDidSchema.index({ did: 1 }, {unique: true});
welcomeDidSchema.index({ type : 1 });
welcomeDidSchema.index({ response : 1 });
welcomeDidSchema.index({ timeCreated: 1 });
app.db.model('welcomeDid', welcomeDidSchema);
};
