exports = module.exports = function(app, passport) {
  var LocalStrategy = require('passport-local').Strategy;

  passport.use(new LocalStrategy(
    function(username, password, done) {
      var conditions = { isActive: true }
      conditions.username = username;
      app.db.models.user.findOne(conditions, function(err, user) {
        if (err) {
          return done(err);
        }

        if (!user) {
          return done(null, false, { message: 'Unknown user' });
        }

        var encryptedPassword = app.db.models.user.encryptPassword(password);
        if (user.password !== encryptedPassword) {
          return done(null, false, { message: 'Invalid password' });
        }

        return done(null, user);
      });
    }
  ));

  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function(id, done) {
    app.db.models.user.findById(id, function(err, user) {
      done(err, user);
    });
  });

};
