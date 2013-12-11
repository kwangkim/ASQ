/** @module models/group
    @description the group Model
*/

var mongoose  = require('mongoose')
, Schema      = mongoose.Schema
, ObjectId    = Schema.ObjectId
, when        = require('when');


var GroupSchema = new Schema({
	sessionId: { type: String },
	questionId: { type: String},
  	users: [{ type: Schema.Types.ObjectId, ref: 'User' } ]
  	socketIds: [{type: String}]
});

mongoose.model("Group", GroupSchema);

module.exports = {
  GroupSchema : GroupSchema
}



