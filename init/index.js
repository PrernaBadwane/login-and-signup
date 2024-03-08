const mongoose = require("mongoose");
const initData = require("./userData.js");
const user = require("../models/user.js");

const MONGODB_URL = "mongodb://127.0.0.1:27017/registeredusers";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGODB_URL);
}

const initDB = async () => {
    console.log(user);
  await user.deleteMany({});
  console.log("data is deleted");

 
  await user.insertMany(initData.data).then(()=>{
    console.log("data is initilized");
  }).catch((err) => console.log(err));
 
};
initDB();
