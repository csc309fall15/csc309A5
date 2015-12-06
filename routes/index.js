var express = require('express');
var passport = require('passport');
var Account = require('../models/account');
var Trade = require('../models/trade');
var mongoose = require('mongoose');
var router = express.Router();

var app = express();

var multer  = require('multer');
var upload = multer({ dest: './public/images' });

// GET home page.
router.get('/', function(req, res) {
    var tradeMap = {};
    if (req.user) {
        Trade.find({ userID: req.user._id }, function (err, trades) {
            trades.forEach(function(trade) {
                tradeMap[trade._id] = trade;
            });
            res.render("index", {user: req.user, trades: tradeMap});
        });
    } else {
        res.render("index", {user: req.user, trades: tradeMap});
    }
});

// GET registration page
router.get('/register', function(req, res) {
    res.render('register', { });
});

// Register new user page
router.post('/register', function(req, res) {
    // First user automatically super admin
    var first = false;
    Account.count({}, function(err, count) {
        if (count == 0){
            first = true;
        }
        Account.register(new Account({ displayname : req.body.displayname, username : req.body.username, sys : first, super : first, avgRating : 3, numOfRatings : 1}),
            req.body.password, function(err, account) {
            // Email address uniquely identifies a user
            if (err) {
                return res.render("register", {info: "Sorry. That email already exists. Try again."});
            }
            passport.authenticate('local')(req, res, function () {  // Send logged in user to home page
                res.redirect('/');
            });
        });
    });
});

// GET login page
router.get('/login', function(req, res) {
    res.render('login', { user : req.user });
});

// Login page
router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
  })
);
// GET logout commands
router.get('/logout', function(req, res) {
    var name = req.username;
    req.logout();
    res.redirect('/');
    req.session.notice = "You have successfully logged out of " + name + "!";
});

// GET List of All Accounts
router.get('/profiles', function(req,res) {
    Account.find({ }, function (err, accounts) {
        var accountMap = {};
        accounts.forEach(function(account) {
            accountMap[account._id] = account;
        });
    res.render("profiles", {user : req.user, accounts: accountMap});
    });
});

// POST List of All a User's Trades on their Profile
router.post('/profiles', function(req, res) {
    Account.findById(req.body._id, function(err, account) {
        Trade.find({ userID: req.body._id }, function (err, trades) {
            tradeMap = {};
            trades.forEach(function(trade) {
                tradeMap[trade._id] = trade;
            });
            res.render("profile", {user: account, trades: tradeMap});
        });
    });
})

// GET Profiling Editing Options
router.get('/edit', function(req, res) {
    res.render('edit', {user : req.user});
});

// Edit Profile information, including password options
router.post('/edit', function(req, res) {
    Account.findById(req.user._id, function(err, account) {
        if (account) {  // Check if an accoun is found
            if (req.body.username != "") {  // Make sure username field isn't empty
                account.username = req.body.username;
            }
            if (req.body.displayname != "") {
                account.displayname = req.body.displayname;
            }
            if (req.body.description != "") {
                account.description = req.body.description;
            }
            if (req.body.newpassword != "" && req.body.newpassword == req.body.newpassword2) {
                account.setPassword(req.body.newpassword, function () {
                    account.save();
                });
            }

            if (req.body.newpassword != req.body.newpassword2) {  // Passwords should match
              return res.render("edit", {info: "Sorry, passwords don't match.", user: account});
            }

            account.save();
        }
        res.redirect('/');
    });
});

// Leave a Comment for a User
router.post('/comment', function(req, res) {
    Account.findById(req.body.com, function(err, account) {
        account.comments.comment = req.body.comment;
        Account.findById(req.user._id, function(err, account2) {
            account.comments.user = account2.displayname;
            account.comments.date = Date.now();
            account.save();
        });
    });
    res.redirect('/');
});

// Rate a User
router.post('/rate', function(req, res) {
    Account.findById(req.body.rate, function(err, account) {
        var rating = req.body.rating;
        account.avgRating = (account.avgRating * account.numOfRatings + +rating)/(account.numOfRatings + 1);
        account.numOfRatings += 1;
        account.save();
    });
    res.redirect('/');
});

// Summary of accounts and trades for admin
router.get('/admin', function(req, res) {
    if (!req.user || !req.user.sys) { return res.render('unauth'); }
    Account.find({ }, function (err, accounts) {
        var accountMap = {};
        accounts.forEach(function(account) {
            accountMap[account._id] = account;
        });
        Trade.find({}, function (err, trades) {
            var tradeMap = {};
            trades.forEach(function(trade) {
                tradeMap[trade._id] = trade;
            });
            res.render('admin', {accounts: accountMap, trades: tradeMap});
        });
    });
});

// Get admin control for editing account information
router.post('/admin', function(req, res) {
    if (!req.user || !req.user.sys) { return res.render('unauth'); }
    Account.findById(req.body._id, function(err, account) {
        console.log(account._id);
        res.render("account", {info: account, user : req.user});
    });
});

// Get admin control for editing trade information
router.post('/admin2', function(req, res) {
    if (!req.user || !req.user.sys) { return res.render('unauth'); }
    Trade.findById(req.body._id, function(err, trade) {
        console.log(trade._id);
        res.render("admintrade", {info: trade, user : req.user});
    });
});

// GET admin trade page
router.get('/admintrade', function(req, res) {
    res.render("admintrade", {info: trade, user : req.user});
});

// Allow admin to edit trade information
router.post('/admintrade', function(req, res) {
    if (!req.user || !req.user.sys) { return res.render('unauth'); }
    Trade.findOne({title : req.body.title}, function(err, trade) {
        trade.title = req.body.title;
        trade.desc = req.body.description;
        trade.itemGive = req.body.tradeitems;
        trade.itemReq = req.body.itemsreq;
        if (req.body.delete) {
            Trade.find({_id : trade._id}).remove().exec();
        }
        trade.save();
    });
    res.redirect('/');
})

// GET account information page
router.get('/account', function(req, res) {
    res.render("account", {info: account, user : req.user});
});

// Allow admin to edit account information
router.post('/account', function(req, res) {
    if (!req.user || !req.user.sys) { return res.render('unauth'); }
    console.log(req.body);
    Account.findOne({username : req.body.username}, function(err, account) {
        account.username = req.body.username;
        account.displayname = req.body.displayname;
        account.description = req.body.description;

        if (req.body.newpassword != "" && req.body.newpassword == req.body.newpassword2) {
            account.setPassword(req.body.newpassword, function () {
                account.save();
            });
        }

        if(req.body.super){
            account.super = true;
            account.sys = true;
        }
        else if(req.body.sys){
            account.super = false;
            account.sys = true;
        }
        else{
            account.super = false;
            account.sys = false;
        }
        if (req.body.delete){
            Account.findById(account._id).remove().exec();
        }
        account.save();
    });
    res.redirect('/admin');
})

// GET maketrade page
router.get('/maketrade', function(req, res) {
    res.render('maketrade', {user: req.user});
});

// POST new trade
router.post('/maketrade', function(req, res) {
    var trade = new Trade();
    trade.title = req.body.tradetitle;
    trade.desc = req.body.tradedesc;
    trade.itemReq = req.body.tradereq;
    trade.itemGive = req.body.tradeitems;
    trade.userID = req.user._id;
    trade.date = Date.now();
    trade.beenReq = false;
    trade.save(function (err) { res.render("trade", {owner: req.user, info: trade, user: req.user}); });
});

// List all current trades
router.get('/tradelist', function(req,res) {
    Trade.find({}, function (err, trades) {
        var tradeMap = {};
        trades.forEach(function(trade) {
            tradeMap[trade._id] = trade;
        });
    res.render("tradelist", {user: req.user, trades: tradeMap});
    });
});

// Visit User who posted a given trade
router.post('/tradelist', function(req, res) {
    console.log(req.body._id);
    Trade.findById(req.body._id, function(err, trade) {
        console.log(trade._id);
        Account.findById(trade.userID, function (err, account) {
            res.render("trade", {owner: account, info: trade, user: req.user});
        });
    });
});

// GET Search Page
router.get('/search', function(req, res){
    res.render("search", {user : req.user})
})

// Find trades matching search
router.post('/search', function(req,res) {
    var tradeMap = {};
    Trade.find({}, function (err, trades) {
        trades.forEach(function(trade) {
            if (trade.itemGive.indexOf(req.body.want) > -1) {
                tradeMap[trade._id] = trade;
            }
        });
        res.render("results", {user: req.user, trades: tradeMap});
    });
});

// GET search results
router.get('/results', function(req,res){
    res.render("results", {user: req.user})
})

// GET upload page for profile images
router.get('/upload', function(req, res) {
    res.render('upload', {user : req.user});
});

// To get the upload page for trade images, POST to /upload with a tradeID and no image
router.post('/upload', upload.single('image'), function(req, res) {
    if (!req.user) { return res.render('unauth'); }
    console.log(req.file);
    if(req.file != undefined) {
        if (!req.body.tradeID) {
            if (!req.body.accID) {
                Account.findById(req.user._id, function(err, account) {
                    account.avatar = req.file.filename;
                    account.save();
                    res.redirect('/');
                });
            } else {
                if (!req.user.sys) { return res.render('unauth'); }
                Account.findById(req.body.accID, function(err, account) {
                    account.avatar = req.file.filename;
                    account.save();
                    Trade.find({ userID: account._id }, function (err, trades) {
                        tradeMap = {};
                        trades.forEach(function(trade) {
                            tradeMap[trade._id] = trade;
                        });
                        res.render("profile", {user: account, trades: tradeMap});
                    });
                });
            }
        } else {
            Trade.findById(req.body.tradeID, function (err, trade) {
                if (!req.user._id.equals(trade.userID) && !req.user.sys) { return res.render('unauth'); }
                trade.pic = req.file.filename;
                trade.save();
                if (!req.user._id.equals(trade.userID)) {
                    Account.findById(trade.userID, function(err, account) {
                        res.render("trade", {owner: account, info: trade, user: req.user});
                    });
                } else {
                    res.render("trade", {owner: req.user, info: trade, user: req.user});
                }
            });
        }
    } else if (req.body.tradeID) {
        Trade.findById(req.body.tradeID, function (err, trade) {
            if (!req.user._id.equals(trade.userID)) { return res.render('unauth'); }
            res.render('upload', {user: req.user, trade: req.body.tradeID});
        });
    }
});

// GET page for test cases
router.get('/ping', function(req, res) {
    res.status(200).send("pong!");
});

module.exports = router;
