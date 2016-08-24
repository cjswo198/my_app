var express = require('express');
var path = require('path');
var app = express();
var mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017")
var db = mongoose.connection;
db.once("open", function(){
  console.log("DB Connected!");
});
db.on("error", function(err){
  console.log("DB ERROR :", err);
})


var dataSchema = mongoose.Schema({
  name:String,
  count:Number
});

var Data = mongoose.model("data", dataSchema);


Data.findOne({name:"myData"}, function(err, data){
    if(err){
      return console.log("Data Error!");
    }

    if(!data){
      Data.create({name:"myData", count:0}, function(err, data){
        if(err){
          return console.log("Data create error!");
        }

        console.log("Success data initialization!", data);

      });
    }
});

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));


app.get('/', function(req, res){
  getCounter(res);
});

app.get('/reset', function(req, res){
  setCounter(res, 0);
});

app.get("/set/count", function(req, res){
  if(req.query.count){
    setCounter(res, req.query.count);
  }
});

app.get("/set/:num", function (req, res){
  setCounter(res, req.params.num);
});

function getCounter(res){
  Data.findOne({name:"myData"}, function(err, data){
    if(err){
      return console.log("DATA ERROR! : "+err);
    }

    res.render("my_first_ejs", data);
  });
}

function setCounter(res, tempCount){
  Data.findOne({name:"myData"}, function(err, data){
    if(err){
      return console.log("DATA ERROR! : "+err);
    }

    data.count = tempCount;
    Data.update({name:"myData"}, {count:data.count}, function(err){
      if(err){
        return console.log("DATA ERROR! : "+err);
      }

      res.render("my_first_ejs", data);
    });

  });
}

app.listen(3000, function(){
  console.log('Server On!');
});
