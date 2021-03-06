'use strict';

var when        = require('when')
  , gen         = require('when/generator')
  , wkeys       = require('when/keys')
  , nodefn      = require('when/node/function')
  , logger      = require('../logger').socLogger
  , appLogger   = require('../logger').appLogger
  , Session     = db.model('Session')
  , Question    = db.model('Question');

module.exports = function(socketUtils){

  /*
   *  Emit an event to the ctrl, folo & wtap namespaces to go to a specific slide.
   */
  var goto = gen.lift(function *gotoGen(socket, evt) {
    try{
      //only accept ctrl goto events
      if (socket.nsp.name !== '/ctrl') return;
      var session = yield Session.findOne({_id: socket.request.sessionId}).exec();

      // TODO load adapter based on presentation type
      var adapter = require('../presentationAdapter/adapters').impress;
      var nextSlide = adapter.getSlideFromGotoData(evt.data);

      if (nextSlide == null){
        appLogger.debug("lib.uitls.socket:goto nextSlide is null")
        //drop event
        return;
      }

      var results = yield when.all([
          session.questionsForSlide(nextSlide),
          session.statQuestionsForSlide(nextSlide)
      ]);

      session.activeSlide = nextSlide;
      session.activeQuestions = results[0];
      session.activeStatsQuestions = results[1];

      if (!! session.activeStatsQuestions.length) {
        evt.stats  = yield socketUtils.getStats(session.activeStatsQuestions, session._id);
      }

      //save does not return a promise
      yield nodefn.lift(session.save.bind(session))();
      socketUtils.notifyNamespaces('asq:goto', evt, session._id, 'ctrl', 'folo', 'wtap');

    }catch(err) {
      logger.error('On goto: ' + err.message, {err: err.stack});
    };
  });

  var handleSocketEvent = function(eventName, socket, evt){
     switch(eventName){
      case "asq:goto":
        goto(socket, evt);
        break
     }
  }

  return{
    handleSocketEvent:handleSocketEvent
  }

}
