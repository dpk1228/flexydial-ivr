'use strict';

exports = module.exports = function(app, mongoose) {
  var userSchema = new mongoose.Schema({
    username: {type: String, unique: true},
    password: String,
    mobile: String,
    email: String,
    address: String,
    roles: String,
    accountType: String,
    isActive: {type: Boolean, default: false},
    timeCreated: { type: Date, default: Date.now },
  });

  userSchema.methods.canPlayRoleOf = function(role) {
    if (role === "admin" && this.roles.admin) {
      return true;
    }
    return false;
  };

  userSchema.methods.defaultReturnUrl = function() {
    var returnUrl = '/user/';

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
  userSchema.index({ address: 1 });
  userSchema.index({ roles: 1 });
  userSchema.index({ accountType: 1 });
  userSchema.index({ timeCreated: 1 });
  app.db.model('user', userSchema);
};
