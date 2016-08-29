var express = require('express');
var path = require('path');
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");

mongoose.connect("mongodb://localhost:50000/person");
var db = mongoose.connection;
db.once("open", function(){
  console.log("DB Connected!");
});
db.on("error", function(err){
  console.log("DB ERROR :", err);
});


var dataSchema = mongoose.Schema({
  title: {type:String},
  body: {type:String},
  createdAt: {type:Date, default:Date.now},
  updatedAt: Date
});

var Post = mongoose.model("user", dataSchema);

app.set("view engine", "ejs");

//setting middlewares
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json()); //request body를 json형태로 바꿈.
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method")); //delete(request 신호)를 보안상 막기 때문....


//setting routes
app.get('/posts', function(req, res){
  Post.find({}).sort('-createdAt').exec(function(err, posts){
    if(err){
      return res.json({success:false, message:err});
    }

    res.render("posts/index", {data:posts});
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
