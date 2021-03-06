var passport     = require('passport')
, appLogger      = require('../lib/logger').appLogger
, authentication = require('../lib/authentication')
, errorTypes     = require('./errorTypes')
, utils          = require('../lib/utils/routes');

var authorizeLiveSession = authentication.authorizeLiveSession;

function forceSSL(req, res, next) {
  if (!req.secure) {
    appLogger.log('HTTPS Redirection');
    return res.redirect(['https://', process.env.HOST,
        (app.get('port') === '443' ? '' : (':' + app.get('port'))),
        req.url].join(''));
  }
  next(null);
}

function isExistingUser(req, res, next, username) {
  var User = db.model('User');
  User.findOne({ username : username }).exec()
  .then(
    function onUser(user) {
      if (! user) {
        errorTypes.add('invalid_request_error');
        res.status(404);
        return res.render('404', {'msg': 'User ' + username + ' does not exist!'});
        //return next(Error.http(404, 'User ' + username + ' does not exist!', {type:'invalid_request_error'}));
      } else {
        req.routeOwner = user;
        next(null);
      }
    }, function onError(err) {
      next(err);
  });
}

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function isAuthenticated(req, res, next) {
  req.isAuthenticated() ? next(null) : next(new Error('Could not authenticate'));
}

function isNotAuthenticated(req, res, next) {
  !req.isAuthenticated() ? next(null) : next(new Error('Already authenticated'));
}

function isNotAuthenticatedOrGoHome(req, res, next) {
  !req.isAuthenticated() 
  ? next(null) 
  : res.redirect('/');
}


/*  Most of ASQ Features need the user to have completed registration
 *  in order to have a valid ASQ username.
 */
function isRegistrationComplete(req, res, next) {
  if (!req.user) {
    next(new Error('There is no authenticated user to check'));
  } else if (req.user.regComplete != true) {
    req.session.redirect_to = req.originalUrl;
    res.redirect('/complete-registration')
  } else {
    next(null);
  }
}

/*  Most of ASQ Features need the user to have completed registration
 *  in order to have a valid ASQ username.
 */
function isNotRegistrationComplete(req, res, next) {
  if (!req.user) {
    next(new Error('There is no authenticated user to check'));
  } else if (req.user.regComplete == true) {
    res.redirect(utils.getPreviousURLOrHome(req))
  } else {
    next(null);
  }
}

/*  For a route with the user parameter, check if the request comes from the
 *  authenticated user whose name matches the user parameter.
 */
function isRouteOwner(req, res, next) {
  if (!req.params.user) {
    next(new Error('Invalid route: missing user parameter.'));
  } else if (req.params.user != req.user.username) {
    next(new Error('Is not owner'));
  } else {
    req.isOwner=true;
    next(null);
  }
}

// var localAuthenticate = passport.authenticate('local', {
//   failureRedirect : '/login/',
//   failureFlash    : true
// });

var localAuthenticate = passport.authenticate('local-mongo', {
  failureRedirect : '/login/',
  failureFlash    : true
});

// var ldapAuthenticate = passport.authenticate('ldapauth', {
//   failureRedirect : '/login-campus/',
//   failureFlash    : true
// });

var ldapAuthenticate = passport.authenticate('local-ldap', {
  failureRedirect : '/login-campus/',
  failureFlash    : true
});

// TODO: if session is not found redirect somewhere sane
function setLiveSession(req, res, next, liveId) {
  var Session = db.model('Session', schemas.sessionSchema);
  Session.findOne({
    _id: liveId,
    slides:req.params.presentationId,
    presenter: req.routeOwner._id,
    endDate: null
  }).populate('slides')
    .exec().then(function onSession(session) {
      if (session) {
        req.liveSession = session;
        return next(null);
      } else {
        res.status(404);
        return res.render('404', {'msg': 'This session does not exist or it\'s not live.'});
      }
    }, function onError(err) {
      return next(err);
    });
}

module.exports = {
  authorizeLiveSession   : authorizeLiveSession,
  forceSSL           : forceSSL,
  isAuthenticated    : isAuthenticated,
  isExistingUser     : isExistingUser,
  isNotAuthenticated : isNotAuthenticated,
  isNotAuthenticatedOrGoHome : isNotAuthenticatedOrGoHome,
  isRouteOwner       : [
    isAuthenticated,
    isRegistrationComplete,
    isRouteOwner
  ],
  isNotRegistrationComplete : [
    isAuthenticated,
    isNotRegistrationComplete,
  ],
  ldapAuthenticate   : ldapAuthenticate,
  localAuthenticate  : localAuthenticate,
  setLiveSession     : setLiveSession,
  validateLdapUser   : require('../lib/ldap').validateLdapUser
}
