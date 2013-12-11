/** @module lib/socket
    @description socket utilities
*/

var when       = require("when")
	, arrayEqual = require('./stats').arrayEqual
	, logger 		 = require('../logger').socLogger
	, Answer 	 	 = db.model('Answer')
	, Session 	 = db.model('Session')
	, Question 	 = db.model('Question')
	, User 	 		 = db.model('User')
	, group      = db.model('Group')
	, users  	 = db.model('Users')
	, ctrls      = db.model('Ctrls');


// returns date either by callback or promise
// copied from https://github.com/glennjones/microformat-node/
// full credit goes to Glenn Jones
// Reuse from ASQParser, should be put in utils!
var returnData = function(errors, data, callback, deferred) {
  if (callback && typeof(callback) == "function") {
    callback(errors, data);
  } else {
    if (errors) {
      deferred.reject(errors);
    } else {
      deferred.resolve(data);
    }
  }
}

var initializeGroups = function(memberNum, minMemberNum, sessionId, questionId){
	actualUsers = users.find();
	actualCtrls = ctrls.find();
	var userNamespaces = new Array(actualUsers.length);
	var userSocketIds = new Array(actualUsers.length);
	var ctrlNamespaces = new Array(actualCtrls.length);
	var ctrlSocketIds = new Array(actualCtrls.length);
	var index = 0;
	for(user in actualUsers){
		userNamespaces[index] = user.namespace;
		userSocketIds[index] = user.socketId;
	}
	index = 0;
	for(ctrl in actualCtrls){
		ctrlNamespaces[index] = ctrl.namespace;
		ctrlSocketIds[index] = ctrl.socketId;
	}
	var groupedUsers = createGroups(userNamespaces, memberNum, minMemberNum, ctrlNamespaces);
	var groupedSockets = createGroups(userSocketIds, memberNum, minMemberNum, ctrlSocketIds);
	saveGroups(groupedUsers, groupedSockets, sessionId, questionId);
	sendGroupIds(questionId);
}

/* @function createGroups
*  @given an array of user, the number of members of the groups you want to create and
*  the minimum number of members in a group, it return an array of arrays that represent
*  groups.
*/

var createGroups = function(userArray, memberNum, minMemberNum, ctrlArray) {
  if (userArray.length < minMemberNum){
    console.log("Minimum number of users not reached");
    return;
  }
  var groupNumber = Math.floor(userArray.length/memberNum);
  var groupRemainder = userArray.length%memberNum;
  // 
  if (groupRemainder < minMemberNum){
    var GroupArray = new Array(groupNumber);
    for(var z = 0; z < groupNumber; z++){
      GroupArray[z] = new Array(memberNum + 1 + ctrlIds.length);
    }
    var groupedUsers = 0;
    for(var x = 0; x < groupRemainder; x++){
      for(var y = 0; y < memberNum + 1; y++){
        GroupArray[x][y] = userArray[groupedUsers];
        groupedUsers++;
      }
      for(var j = 0; j < ctrlIds.length; j++){
      	GroupArray[x][memberNum] = ctrlIds[j];
  	  }
    }
    for(var x = groupRemainder; x < groupNumber; x++){
      for(var y = 0; y < memberNum; y++){
        GroupArray[x][y] = userArray[groupedUsers];
        groupedUsers++;
      }
      for(var j = 0; j < ctrlIds.length; j++){
      	GroupArray[x][memberNum] = ctrlIds[j];
  	  }
    }
  }
  // if we have enough members to create a group, an additional group will be created
  else{
    var GroupArray = new Array(groupNumber);
    for(var z = 0; z < groupNumber; z++){
      GroupArray[z] = new Array(memberNum + ctrlIds.length);
    }
    var groupedUsers = 0;
    for(var x = 0; x < groupNumber; x++){
      for(var y = 0; y < memberNum; y++){
        GroupArray[x][y] = userArray[groupedUsers];
        groupedUsers++;
      }
      for(var j = 0; j < ctrlIds.length; j++){
      	GroupArray[x][memberNum] = ctrlIds[j];
  	  }
    }
    for(var y = 0; y < groupRemainder; y++){
      GroupArray[groupNumber][y] = userArray[groupedUsers];
      groupedUsers++;
    }
    for(var j = 0; j < ctrlIds.length; j++){
      	GroupArray[x][memberNum] = ctrlIds[j];
  	  }
  }
  return GroupArray;
}

var sendGroupId = function(user, questionId, socket, groupId){
	socket.emit('set-groupId', {questionId: questionId groupId: groupId}))
}

var sendGroupIds = function(questionId){
	var groups = group.find();
	for(var index = 0; index < groups.length; index++){
		for(var index2 = 0; index2 < groups[index].length; index2++){
			sendGroupId(groups[index].users[index2], questionId, groups[index].socketIds[index2], groups[index]._id)
		}
	}
	
}

var saveGroups = function(groups, socketIds, sessionId, questionId){
	for(var x = 0; x < groups.length; x++){
		var userInfo = users.find({ nameSpace: group})
		groupInfo = {sessionId: sessionId, questionId: questionId, 
			users: groups[x], socketIds: socketIds[x]}
		group.insert(groupInfo);
	}
}

var propagateInRoom = function(eventName, evt, io, user, roomId) {
	if (arguments.length < 5) {
		return;
	}
	var selectedGroup = group.find( _id: roomId)
	for(var x = 0; x < selectedGroup.users.length; x++){
		if (selectedGroup.users[x] != user)
			io.sockets.socket(selectedGroup.socketId[x]).emit(eventName, evt);
	}
}

var notifyInRoom = function(eventName, evt, io, roomId) {
	if (arguments.length < 4) {
		return;
	}
	var selectedGroup = group.find( _id: roomId)
	for(var x = 0; x < selectedGroup.users.length; x++){
		io.sockets.socket(selectedGroup.socketId[x]).emit(eventName, evt)
	}
}

var saveUsers = function(socket){
	userInfo = {displayName: getDisplayName(socket), id: socket.id}
	users.insert(userInfo);
}
var saveCtrl = function(socket){
	ctrlInfo = {displayName: getDisplayName(socket), id: socket.id}
	ctrls.insert(ctrlInfo);
}

/*
 *  Get the dislayName stored with a socket.
 *  This function was rewritten to support a promise.
 */
var getDisplayName = function(socket, callback) {
	var deferred = when.defer();

	socket.get("displayName", function(err, name) {
		if (callback & (typeof(callback) == "function")) {
			callback(err, name);
		} else if (err) {
			deferred.reject(err);
		} else {
			deferred.resolve(name);
		}
	});

	return deferred.promise;
}

var getSessionId = function(socket, callback) {
	var deferred = when.defer();

	socket.get('sessionId', function(err, sid) {
		if (callback && typeof(callback) === 'function') {
			callback(err, sid);
		} else if (err) {
			deferred.reject(err);
		} else {
			deferred.resolve(sid);
		}
	})
	return deferred.promise;
}

/*
 *  Get the session from a socket.
 */
var getSession = function(io, socket, callback) {
	var deferred = when.defer();

	getSessionId(socket).then(
		function retrieveSession(sid) { 
			return Session.findById(sid).exec();
		}).then(
		function returnSession(session) {
			if (callback && typeof(callback) === 'function') {
				return callback(null,  session);
			} else {
				deferred.resolve(session);
			}
		}, function onError(err) {
			logger.error('Error on retrieving session:\n\t' + err.toString());
			if (callback && typeof(callback) === 'function') {
				return (err, null);
			} else {
				deferred.reject(err);
			}
		});

	return deferred.promise;
}

var notifyNamespaces = function(eventName, evt, io, sessionId, namespaces) {
	if (arguments.length < 5) {
		return;
	}
	var args = Array.prototype.slice.call(arguments, 4);
	for (var i=0; i<args.length; i++) {
		io.of('/' + args[i]).in(sessionId).emit(eventName, evt);
	}
}

/*
 *  Emit an event to the ctrl, folo & wtap namespaces to go to a specific slide.
 */
var goto = function(io, socket, evt) {
	var sessionId      = null
    , currentSession = null;

	getSession(io, socket)
		.then(function(session){
			sessionId      = session._id;
			currentSession = session;
			return when.all([
				currentSession.questionsForSlide(evt.slide),
      	currentSession.statQuestionsForSlide(evt.slide)
			]);
		})
		.then(function(results) {
			var activeQuestions 		 = results[0];
    	var activeStatsQuestions = results[1];
    	//if(activeQuestions == collabQuestions){
    	//	initializeGroups;
    	//}
    	notifyNamespaces('asq:goto', evt, io, sessionId, 'ctrl', 'folo', 'wtap');
      
      currentSession.activeSlide = evt.slide;
      currentSession.activeQuestions = results[0];
      currentSession.activeStatsQuestions = results[1];

      //TODO: Handle stats
      
			// if (activeStatsQuestions) {
			// 	for (var i=0; i < io.of('/folo').clients(sessionId).length; i++) {
			// 		io.of('/folo').clients(sessionId)[i].get('displayName',
			// 			function(err, name) {
			// 				if (!err && name) {
			// 					displayNames.push(name);
			// 					if  (i === io.of('/folo').clients(sessionId).length - 1) {
			// 						//send answers
			// 					}
			// 				}
			// 			})
			// 	}
			// }

      currentSession.save(function(err) {
				if (err) { throw err; }
      });

 		}, function(err) {
 			throw err;
 		})

}

var gotosub = function(io, socket, evt) {
	getSession(io, socket, function(err, session){
		if (err) {
			throw err;
		}
		notifyNamespaces('asq:gotosub', evt, io, session._id, 'ctrl', 'folo', 'wtap');
    session.activeSubstep = evt.substepIndex;
    session.save(function(err) {
			if (err) { throw err; }
    });
	});

}

var submit = function(io, socket, evt) {
	var data;
	when.all([
		getSession(io, socket),                 //SessionId
		getDisplayName(socket),                    //Socket (user) name
		Question.findById(evt.questionId).exec() //Question
	])
		.then(
			function updateAnswer(info) {
				data=info;

				//FIXME : handle questions without solution better
				var score = 100
					, solution = data[2].getSolution();
					console.log("YABAADA", solution)
				if(solution){
					score = arrayEqual(evt.answers, data[2].getSolution()) ? 100 : 0
				}
				
				return  Answer.findOneAndUpdate({
					session  : data[0]._id,    //SessionId
					answeree : data[1],    //Socket (user) name
					question : data[2]._id //_id attr. of question
				}, {
					submission  : evt.answers,
					correctness : score
				}, { upsert : true // Create the answer if it does not exist
													 // This allow for resubmission.
													 // (needs to be changed for peer assessment)
			}).exec();
		})
			.then(
				function countAnswers(answer){
					return Answer.count({question : data[2]._id}).exec();
		})
			.then(
				function notifySubmitted( submittedAnswers) {
					var clients = io.of('/folo').clients(data[0].id).length
						, resEvent = { submittedViewers: submittedAnswers,
													 totalViewers: clients,
													 questionId : evt.questionId }
					console.log(resEvent)
					socket.emit('asq:submitted', resEvent);
					notifyNamespaces('asq:submitted', resEvent, io, data[0]._id, 'ctrl');
		},
		function(err) {
			logger.error(err);
			throw err;
		});
}

var terminate = function(io, socket, evt) {
	var sessionId = null;

	getSessionId(io, socket).then(
		function updateSession(sessionId) {
			sessionId = session._id;
			return Session.findByIdAndUpdate(sessionId, {
				endDate : newDate
			}).exec();
		}).then(
		function updateUser(session) {
			return User.findByIdAndUpdate(session.presenter, {
				current : null
			}).exec();
		}).then (
		function notifyTerminated(user) {
			notifyNamespaces('asq:session-terminated', {}, io, sessionId,
				'ctrl', 'folo', 'wtap', 'stat');
		}, function onError(err) {
			logger.error('Error on terminate session:\n\t' + err.toString());
		});
}

function deleteAndNotify(io, socket, data, namespace, toNotify) {
	var args 				= Array.prototype.slice.call(arguments, 4);
	var sessionId   = data[0];
	var	displayName = data[1];
	var eventName 	= 'asq:' + namespace + '-disconnected';
	var evt 				= { displayName : displayName };
	
	
	delete socket;
	notifyNamespaces(eventName, evt, io, sessionId, args);
	logger.info('[' + namespace.toUpperCase() + '] '
		+ displayName + " disconnected");
}

var ioConnect = function(io, socket, namespace, clientName) {
	socket.set('sessionId', socket.handshake.session._id); //easier to retrieve.
	socket.join(socket.handshake.session._id);
	socket.emit('asq:goto', { slide: socket.handshake.session.activeSlide });
	logger.info('[' + namespace.toUpperCase() + '] ' + clientName + " connected");
}

var ctrlConnect = function(io, socket) {
	var displayName = socket.handshake.displayName;
	var sessionId 	= socket.handshake.session._id;
	var evt    			= { name : displayName };

	socket.set('displayName', displayName);
	ioConnect(io, socket, 'ctrl', displayName);
	notifyNamespaces('asq:ctrl-connected', evt, io, sessionId,
			'ctrl', 'wtap', 'folo');
}

var ctrlDisconnect = function(io, socket) {
	logger.info('CTRL Disconnect');
	when.all([
		getSessionId(socket),
		getDisplayName(socket)
	]).then(
	function delAndNotify(data) {
		deleteAndNotify(io, socket, data, 'ctrl', 'ctrl', 'folo', 'wtap');
	},
	function ctrlDisconnectErr(err) {
		appLogger.error('Failed to disconnect client from \'ctrl\':\n\t'
			+ err.toString());
	});
}

var foloConnect = function(io, socket) {
	var displayName = socket.handshake.displayName
		, sessionId 	= socket.handshake.session._id;

	socket.set('displayName', displayName);
	ioConnect(io, socket, 'folo', displayName);

	var clients = io.of('/folo').clients(sessionId).length
	  , evt = {connectedClients: clients, name : displayName }

	notifyNamespaces('asq:folo-connected', evt, io, sessionId,
			'ctrl', 'wtap', 'folo');
}

var foloDisconnect = function(io, socket) {
	when.all([
		getSessionId(socket),
		getDisplayName(socket)
	]).then(
	function delAndNotify(data) {
		deleteAndNotify(io, socket, data, 'folo', 'ctrl', 'folo', 'wtap');
	},
	function foloDisconnectErr(err) {
		appLogger.error('Failed to disconnect client from \'folo\':\n\t'
			+ err.toString());
	});
}

var wtapConnect = function(io, socket) {
	ioConnect(io, socket, 'wtap', 'Wtap client');
}

var wtapDisconnect = function(io, socket) {
	getSessionId(socket).then(
	function handleDisconnect(sessionId) {
		deleteAndNotify(io, socket, [sessionId, 'Wtap client'], 'wtap', 'ctrl');
	},
	function wtapDisconnectErr(err) {
		appLogger.error('Failed to disconnect client from \'wtap\':\n\t'
			+ err.toString());
	});
}

var statConnect = function(io, socket) {
	ioConnect(io, socket, 'stat', 'Stat client');
}

var statDisconnect = function(io, socket) {
	getSessionId(socket).then(
	function handleDisconnect(sessionId) {
		deleteAndNotify(io, socket, [sessionId, 'Stat client'], 'stat', 'ctrl');
	},
	function wtapDisconnectErr(err) {
		appLogger.error('Failed to disconnect client from \'stat\':\n\t'
			+ err.toString());
	});
}

module.exports = {
	goto           : goto,
	gotosub        : gotosub,
	submit         : submit,
	ctrlConnect    : ctrlConnect,
	ctrlDisconnect : ctrlDisconnect,
	foloConnect    : foloConnect,
	foloDisconnect : foloDisconnect,
	wtapConnect    : wtapConnect,
	wtapDisconnect : wtapDisconnect,
	statConnect    : statConnect,
	statDisconnect : statDisconnect,
	terminate 		 : terminate
}