var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
	displayname: String,
    username: String,
    password: String,
    description: String,
    sys: Boolean,
    super: Boolean,
    avatar: String,
    behavior: {
    	IP: String,
    	location: String,
    	mostViewedUser: String,
    	mostViewedPage: String,
    	device: String
    }
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', Account);