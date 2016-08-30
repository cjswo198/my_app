var express = require('express');
var path = require('path');
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var passport = require("passport");
var session = require("express-session");
var flash = require("connect-flash");
var async = require("async");
var mongoosePaginate = require('mongoose-paginate');

mongoose.connect("mongodb://localhost:50000/person");
var db = mongoose.connection;
db.once("open", function(){
  console.log("DB Connected!");
});
db.on("error", function(err){
  console.log("DB ERROR :", err);
});


var dataSchema = new mongoose.Schema({
  title: {type:String},
  body: {type:String},
  createdAt: {type:Date, default:Date.now},
  updatedAt: Date
});


dataSchema.plugin(mongoosePaginate); //페이징처리

var Post = mongoose.model("post", dataSchema);


var userSchema = mongoose.Schema({
  email:{type:String, require:true, unique:true},
  nickname:{type:String, require:true, unique:true},
  password:{type:String, require:true},
  createdAt:{type:Date, default:Date.now}
});

var User = mongoose.model("user", userSchema);




app.set("view engine", "ejs");



//setting middlewares
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json()); //request body를 json형태로 바꿈.
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method")); //delete(request 신호)를 보안상 막기 때문....
app.use(flash());
app.use(session({secret:"MySecret"}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done){ //session에 id를 저장
  done(null, user.id);
});

passport.deserializeUser(function(id, done){ //session에서 저장된 id로 user를 가져옴
  User.findById(id, function(err, user){
    done(err, user);
  });
});


//setting strategy
var LocalStrategy = require("passport-local").Strategy; //Local-DB 탐색 전략
passport.use("local-login",
             new LocalStrategy({
                                 usernameField : "email",
                                 passwordField : "password",
                                 passReqToCallback : true //로그인 후 callback함수 호출
                               },
                               function(req, email, password, done){
                                 User.findOne({"email":email}, function(err, user){
                                               if(err){
                                                 return done(err);
                                               }

                                               if(!user){
                                                 req.flash("email", req.body.email);
                                                 return done(null, false, req.flash("loginError", "No user found."));
                                               }

                                               if(user.password != password){
                                                 req.flash("email", req.body.email);
                                                 return done(null, false, req.flash("loginError", "Password not matched."));
                                               }
                                             });

                                             return done(null, user);
                              })
             );



//setting login routes
app.get('/', function(req, res){ //home이 posts로 항상 redirect
  res.redirect('/posts');
});

app.get('/login', function(req, res){
  res.render('login/login', {email:req.flash("email")[0], loginError:req.flash("loginError")}); //정상적인 로그인 페이지일 경우, flash값이 없으므로 메시지 출력x, 비정상적인 경우일때 값을 response로 넘기고 값을 비움(flash).
});

app.post('/login', function(req, res){ //로그인 post 요청(중요)
    req.flash("email"); //값을 비움
    if(req.body.email.length === 0 || req.body.password.length === 0 ){
      req.flash("email",req.body.email); //flash에 값을 담고
      req.flash("loginError", "Enter email and password.");
      req.redirect('/login'); //error메세지를 띄울 login창으로 보냄
    }else{
      next();
    }
  }, passport.authenticate('local-login', {
    successRedirect: '/posts',
    failureRedirect: '/login',
    failureFlash : true
  })
);



//setting routes
app.get('/posts', function(req, res){
  console.log(req.query.pageNum);
  Post.paginate({},  {page:(req.query.pageNum === undefined ? 1 : req.query.pageNum) , limit: 10, sort:{'createdAt':-1} }, function(err, posts) {
      // result.docs
      // result.total
      // result.limit
      // result.page 
      // result.pages

      var maxPage =  Math.ceil(posts.total/posts.limit);

      if(err){
        return res.json({success:false, message:err});
      }
      res.render("posts/index", {data:posts.docs, page:posts.page, maxPage:maxPage });
  });



}); //index(RESTful)





app.get('/posts/new', function(req, res){
  res.render("posts/new");
}); //new(RESTful)


app.post('/posts', function(req, res){
  Post.create(req.body.post, function(err, post){
    if(err){
      return res.json({success:false, message:err});
    }

    res.redirect('/posts'); //처리 후 index 페이지로 이동
  });
});//create(RESTful)



app.get('/posts/:id', function(req, res){
  Post.findById({_id:req.params.id}, function(err, post){
    if(err){
      return res.json({success:false, message:err});
    }

    return res.render("posts/show", {data:post});
  });
});//show(RESTful)

app.delete('/posts/:id', function(req, res){
  Post.findByIdAndRemove({_id:req.params.id}, function(err, post){
    if(err){
      res.json({success:false, message:err});
    }

    res.redirect("/posts"); //처리후 index페이지로 이동.
  });
});//delete(RESTful)

app.get('/posts/:id/edit', function(req, res){
  Post.findById({_id:req.params.id}, function(err, post){
    if(err){
      return res.json({success:false, message:err});
    }

    return res.render("posts/edit", {data:post});
  });

});

app.put('/posts/:id', function(req, res){
  req.body.post.updatedAt = Date.now();
  Post.findByIdAndUpdate({_id:req.params.id}, req.body.post , function(err, post){
    if(err){
      return res.json({success:false, message:err});
    }

    return res.redirect('/posts/'+req.params.id); //file path가 아니라 request path
  });

});


app.listen(3000, function(){
  console.log('Server On!');
});
