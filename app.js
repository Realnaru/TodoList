//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");//reauiire mongoose
const _ = require("lodash");//require lodash

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//conneect and create mongo db
mongoose.connect("mongodb+srv://admin-user:test123@cluster0.c48rv.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

//create new schema for db
const itemsSchema = {
  name: String
};

//create collection
const Item = mongoose.model("Item", itemsSchema);

//create new schema for list collection to store custom lists that we can add
const listSchema = {
  name: String,
  items: [itemsSchema]
};

//create list collection
const List = mongoose.model("List", listSchema);

//create new items in the collection
//start
const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});
//finish


const defaultItems = [item1, item2, item3];//new array of created items

app.get("/", function(req, res) {

  //find all in the DB
  Item.find({}, (err, foundItems) => {
    if (!err) {
      //and if there is no results(DB is empty)
      if (foundItems.length === 0) {

        //insert default items array  into DB
        Item.insertMany(defaultItems, (err) => {
          //if there is no error, log success
          if (!err) {
            console.log("Successfully inserted!");
          };
        });
       res.redirect("/");//redirect to the root route
      } else {

        //if there are some results, render page with theese results
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }//end of the else
    };//end of the if (!err)
  });//end of the Item.find()
});//end of the callback

//handle custom lists routes
app.get("/:newList", (req, res) => {

  const newListName = _.capitalize(req.params.newList);//save name of a new list capitalized

   //find the list in the coolection to check if entered listName already exists
   List.findOne({name: newListName}, (err, foundList) => {
    if (!err) {// if there is no error
      if (!foundList) {//if there are no results

        //create a new list with the new custom name and array of default items
        const list = new List({
          name: newListName,
          items: defaultItems
        });
        list.save();//save the list in db
        res.redirect("/" + newListName);//redirect to the new custom list route
      } else {
        //if this list already exists then render a page with listTitle of
        //foundlist(newListName) and foundList items witch are basically just
        //default array items
        //show an existing list
        res.render("list", {listTitle: foundList.name, newListItems:foundList.items});
      }//end of the else block
    };//end of the if statement
  });//end of the callback for findOne

});//end of the new custom list Route's callback



app.post("/", function(req, res){

  const itemName = req.body.newItem;//save newItem from webpage
  const listName = req.body.list;//name of the submit "+" button with value of list title

  //create new item with the name itemName
  const newItem = new Item({
    name: itemName
  });

  if (listName === "Today") {//if listTitle = Toitle of the main page

    newItem.save();//save the item to the DB
    res.redirect("/");//redirect to the root route

  } else {
    //find item with name = listName in the DB
    List.findOne({name: listName}, (err, foundList) => {

        foundList.items.push(newItem);//push new item into array of items
        foundList.save();//save list
        res.redirect("/" + listName);//redirect to the new route
    });//end of callback

  }//end of the else

});//end of the "/" callback

app.post("/delete", (req, res) => {

  const checkedItemId = req.body.checkbox;//save checkbox from the page as const
  const listName = req.body.listName;

  if (listName === "Today") {

    //find element by id and remove from DB
    Item.findByIdAndRemove(checkedItemId, {useFindAndModify: true}, (err) => {
      //if there is no error remove the found item and redirect to "/"
      if (!err) {
        console.log("Successfully removed!");
        res.redirect("/");
      };//end of if
    });//end of findAndRemove callback

  } else { //end of if (listName === "Today")
    //find list with name = listName then delete item with id = checkedItemId from the items array
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
      if (!err) {
        res.redirect("/" + listName);//redirect to the custom list
      }//end of if(!err)
    });//end of findOneAndUpdate
  }//end of else block


});//end of post



app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started succesfully");
});                    
