var config    = require('../config')
  , mongoose  = require('mongoose');

  //require('../lib/utils/socket')
  var createGroups = function(userArray, memberNum, minMemberNum) {
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
      GroupArray[z] = new Array(memberNum + 1);
    }
    var groupedUsers = 0;
    for(var x = 0; x < groupRemainder; x++){
      for(var y = 0; y < memberNum + 1; y++){
        GroupArray[x][y] = userArray[groupedUsers];
        groupedUsers++;
      }
    }
    for(var x = groupRemainder; x < groupNumber; x++){
      for(var y = 0; y < memberNum; y++){
        GroupArray[x][y] = userArray[groupedUsers];
        groupedUsers++;
      }
    }
  }
  //
  else{
    var GroupArray = new Array(groupNumber + 1);
    for(var z = 0; z < groupNumber + 1; z++){
      GroupArray[z] = new Array(memberNum);
    }
    var groupedUsers = 0;
    for(var x = 0; x < groupNumber; x++){
      for(var y = 0; y < memberNum; y++){
        GroupArray[x][y] = userArray[groupedUsers];
        groupedUsers++;
      }
    }
    for(var y = 0; y < groupRemainder; y++){
      GroupArray[groupNumber][y] = userArray[groupedUsers];
      groupedUsers++;
    }
  }
  return GroupArray;
}

var createGroupIds = function(groupNumber){
  baseString = "000";
  groups = new Array(groupNumber);
  if (groupNumber < 10){
    for(var x = 1; x <= groupNumber; x++){
      groups[x - 1] = baseString + "0" + x;
    }
    return groups;
  }
  else{
    for(var x = 1; x < 10; x++){
      groups[x - 1] = baseString + "0" + x;
    }
    for(var y = 10; y < groupNumber; y++){
      groups[y - 1] = baseString + y;
    }
    return groups;
  }
}

var max  = 4;
var min = 2;
var userA;
// mongodb connection (Global)  
db = mongoose.createConnection(config.host, config.dbName);

require('../models/user')

// var User = db.model("User", require('../models/user'))

var chai = require('chai')
// , chaiAsPromised = require("chai-as-promised")
, assert = chai.assert
, expect = chai.expect
, should = chai.should();

// , SocketTest = require('setupSocket');

// SocketTest.setup();

// var socket = io.connect(;;)

var mongooseFixtures = require('./util/mongoose-fixtures')
  , groupFixtures = require('./fixtures/group.fixtures')
  , fixtures = groupFixtures.fixtures


describe('Group test', function() {

  describe('Room Creation', function(){

    before(function(done){
      mongooseFixtures.load(fixtures, db, function(){
       // userA = db.find();
       // var grouped = createGroups(userA.name, max, min)
       // expect(grouped.length).to.equal(5);
        done();
        
      })
    })
    

    // beforeEach

    // after
    // afterEach
    it('should create 5 rooms', function(done){
      setTimeout(function(){
         expect(5).to.equal(5);

         done(new Error('I dont like errors'));
       }, 100)
     
    });

    it('should connect me to room 1', function(done){

      var a = new Array();
      for( var x = 0 ; x < 20; x++){
        a[x] = 2*x;
      }
      var grouped = createGroups(a, max, min)
      expect(grouped.length).to.equal(5);
      done();
    });

    it('should connect me to room 1', function(done){
      var a = new Array();
      for( var x = 0 ; x < 22; x++){
        a[x] = 2*x;
      }
      var grouped = createGroups(a, max, min)
      expect(grouped.length).to.equal(6);
      expect(grouped[5].length).to.equal(4);
      done();
    });


    it('should connect me to room 1', function(done){
      var a = new Array();
      for( var x = 0 ; x < 41; x++){
        a[x] = 2*x;
      }
      var grouped = createGroups(a, max, min)
      expect(grouped.length).to.equal(10);
      expect(grouped[9].length).to.equal(5);
      expect(grouped[0].length).to.equal(5);
      var groups = createGroupIds(grouped.length);
      expect(groups[0]).to.equal("00001");
      expect(groups[9]).to.equal("00010");
      done();
    });
     


    it.skip('should connect me to room 1', function(done){
      done();
    });
  })
})