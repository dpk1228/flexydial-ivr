'use strict';

exports = module.exports = function(app, mongoose) {
  var userSchema = new mongoose.Schema({
    username: {type: String, unique: true},
    password: String,
    mobile: String,
    email: String,
    roles: String,
    isActive: {type: Boolean, default: true},
    timeCreated: { type: Date, default: Date.now },
  });

  userSchema.methods.canPlayRoleOf = function(role) {
    if (role === "admin" && this.roles === role) {
      return true;
    }
    if (role === "user" && this.roles === role) {
      return true;
    }
    return false;
  };

  userSchema.methods.defaultReturnUrl = function() {
    var returnUrl = '/user';

    if (this.canPlayRoleOf('admin')) {
      returnUrl = '/admin';
    }

    return returnUrl;
  };

  userSchema.statics.encryptPassword = function(password) {
    return require('crypto').createHmac('sha512', app.config.get('cryptoKey')).update(password).digest('hex');
  };

  userSchema.index({ username: 1 }, {unique: true});
  userSchema.index({ mobile: 1 });
  userSchema.index({ email: 1 });
  userSchema.index({ timeCreated: 1 });
  app.db.model('user', userSchema);
};
