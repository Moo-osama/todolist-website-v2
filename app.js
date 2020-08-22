//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const loDash = require("lodash")
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/todolistDb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set('useFindAndModify', false);
const itemSchema = {
  name: String
};

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<== Hit this to delete an item."
});

let defaultItems = [item1, item2, item3];

const listsSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listsSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully added 3 Items");
        }
      })
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }

  })



});

app.get("/:customListName", function(req, res) {

  const customListName = loDash.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        const newList = new List({
          name: customListName,
          items: defaultItems
        });
        newList.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  })

})

app.post("/", function(req, res) {

  const item = req.body.newItem;

  const itemDoc = new Item({
    name: item
  })

  if (req.body.list === "Today") {
    itemDoc.save();

    res.redirect("/");
  } else {
    List.findOne({
      name: req.body.list
    }, function(err, foundList) {
      foundList.items.push(itemDoc);
      foundList.save();
      res.redirect("/" + req.body.list);
    })
  }
});

app.post("/delete", function(req, res) {

  const checkedListName = req.body.checkedListName;


  if (checkedListName === "Today") {
    Item.findByIdAndRemove(req.body.checkbox, function(err) {
      if (!err) {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({
      name: checkedListName
    }, {
      $pull: {
        items: {
          _id: req.body.checkbox
        }
      }
    }, function(err, foundList) {
      if (!err) {
        res.redirect("/" + checkedListName);
      }
    });
  }



});


app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
