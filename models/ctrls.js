/** @module models/group
    @description the group Model
*/

var mongoose  = require('mongoose')
, Schema      = mongoose.Schema
, ObjectId    = Schema.ObjectId
, when        = require('when');


var CtrlSchema = new Schema({
	nameSpace: { type: String },
	socketId: { type: String},
});

mongoose.model("Ctrls", CtrlSchema);

module.exports = {
  CtrlSchema : CtrlSchema
}



