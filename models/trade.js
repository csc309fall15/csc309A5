var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var Trade = new Schema({
    title: String,
    desc: String,
    request: String,
    userID: String,
    date: String,
    flag: Boolean
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Trade', Trade);