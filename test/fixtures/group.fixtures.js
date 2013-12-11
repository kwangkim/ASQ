// ids
var ObjectId = require('mongoose').Types.ObjectId

var numUser = 20
 , ids = []
 , users = [];

for (var i=0; i<numUser; i++){
  ids.push(ObjectId()) 
  users.push({
    _id: ids[i],
    name: 'user' + [i+1],
    password: 'abcedfghiklmnopqrstuvwxyz',
    email: 'user' +(i+1) + '@test.com',
  }) 
}

exports.ids =ids
exports.fixtures = {};

//models.User
exports.fixtures.User = users
