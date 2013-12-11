/** @module models/group
    @description the group Model
*/

var mongoose  = require('mongoose')
, Schema      = mongoose.Schema
, ObjectId    = Schema.ObjectId
, when        = require('when');


var UsersSchema = new Schema({
	nameSpace: { type: String },
	socketId: { type: String},
});

mongoose.model("Users", UsersSchema);

module.exports = {
  UsersSchema : UsersSchema
}



