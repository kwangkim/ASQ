/** @module routes/upload
    @author Jacques Dafflon jacques.dafflon@gmail.com
    @description Functions handling upload of new slideshows.
    TODO Handle upload of incrrect slideshows and their removal from the server.
    */

var slideshow     = require('../models/slideshow')
, questionModel  = require('../models/question')
, fs              = require('fs')
, unzip           = require('unzip')
, pfs             = require('promised-io/fs')
, cheerio         = require('cheerio')
, AdmZip          = require('adm-zip')
, rimraf          = require('rimraf')
, logger          = require('../lib/logger')
, asqParser       = require('../lib/asqParser')
, config          = require('../config')
, fsUtil          = require('../lib/fs-util')


logger.setLogLevel(0);

module.exports.show = function(req, res) {
  res.render('upload', {username: req.user.name});
}

/*
 * Handle a POST request to the server to upload a new slideshow.
 * This function checks the slideshow is in the correct format in order to work
 * Some checks and handling still need to be done...
 * Handling for stats is long and complex and need to be optimized.
 */
module.exports.post = function(req, res) {


/**
  STEPS TO CREATE A NEW SLIDESHOW
  1) create new Slideshow model
  2) unzip files
  3) make sure at least one html exists
  4) parse questions
  5) create new questions if they exist
  6) update the slide information for each question
  7) store new slideshow object


readfile()
  .then(extractquestions)
  .then(check for new questions)
  .then(insert new questions)
  .then(update slide show information for new questions)

  */

  // STEPS TO CREATE A NEW SLIDESHOW

  // 1) create new Slideshow model
  var Slideshow = db.model('Slideshow', slideshow.slideshowSchema);

  var newSlideshow = new Slideshow({
    title:req.files.upload.name,
    owner: req.user._id
  });

  // 2) unzip files
  var folderPath = config.rootPath + '/slides/' + newSlideshow._id;
  var zip = new AdmZip(req.files.upload.path);
  zip.extractAllTo(folderPath);

  // make sure at least one html exists
  fsUtil.getFirstHtmlFile(folderPath)
    .then(
      function(filePath){
        logger.log('will use ' + filePath + ' for main presentation file...');
        return pfs.readFile(filePath)
    })

    //4) parse questions
    .then(    
      function(file) {
        logger.log('parsing main .html file for questions...');
        return asqParser.parse(file);

    })

    //5) create new questions if they exist
    .then(
      function(questionsJSON){

      logger.log('questions successfully parsed');
      questionModel.createlo(questionsJSON, function(err){
      //   console.log( "I am here" )
         res.send(200, JSON.stringify(questionsJSON));
      })
     
    },

    function(error){
      logger.error(error);
    });


    // Check and parse questions.json
    // var questions = pfs.readFile(folderPath + '/questions.json').then(
    //   function(file) {
    //     console.log('questions ok');
    //     var questions = JSON.parse(file);
    //     for (var i=0; i<questions.length;i++) {
    //      var questionDB= db.model('Question', schemas.questionSchema);
    //      var newQuestion=new questionDB({
    //       questionText:questions[i].questionText,
    //       questionType: questions[i].questionType,
    //       afterslide: questions[i].afterslide
    //     });
    //      newQuestion.save();
    //      newSlideshow.questions.push(newQuestion._id);

    //      var optionDB=db.model('Option', schemas.optionSchema);
    //      for (var j=0;j< questions[i].options.length;j++) {
    //       newOptionDB=new optionDB( {
    //         optionText: questions[i].options[j].optionText,
    //         correct: questions[i].options[j].correct
    //       });
    //       newOptionDB.save();
    //       newQuestion.answeroptions.push(newOptionDB._id);
    //       newQuestion.save();

    //     }


    //   }

    //   return true;
    // },
    // function() {
    //   console.log('error: questions.json');
    //   newSlideshow.questions = [];
    //   return false;
    // }
    // );

// var group = all(index, assets, questions);
// var done = when(group,
//   function(result) {
//     console.log('index result is ' + result[0]);
//     console.log('assets result is ' + result[1]);
//     console.log('questions result is ' + result[2]);
//     console.log('all ok');
//     seq([
//       function() {
//         newSlideshow.save();
//       },
//       function() {
//         if (result[1]) pfs.unlink(folderPath + '/assets.json');
//       },
//       function() {
//         if (result[2]) pfs.unlink(folderPath + '/questions.json');
//       },
//       function() {
//         var User = db.model('User', schemas.userSchema);
//         User.findByIdAndUpdate(req.user._id, { $push: {slides : newSlideshow._id } }, function(err, user) {
//           pfs.unlink(req.files.upload.path)
//           //.then(res.redirect('/user/'));
//         });
//       }]);
//   },
//   function() {
//     console.log('something went wrong');

//             //Remove the extracted folder
//             rimraf(folderPath, function(err) {
//               if(err) throw err;
//                 // Remove the downloaded archive (zip file).
//                 pfs.unlink(req.files.upload.path)
//                 //.then(res.redirect('/'));
//               });
//           });
}
