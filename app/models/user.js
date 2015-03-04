var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  //initialize: function(){
  //  this.on('creating', function() {
  //
  //  });
  //}
 //links : function() {
  //  return this.hasMany(Links);
  //}


});

module.exports = User;