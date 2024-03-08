const express = require("express");
const app = express();
const mongoose = require("mongoose");
const user = require("./models/user.js");
const path = require("path");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const passwordResetTokens = {};
const tokenExpiration = 3600000;

// connected to database
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

// ejs setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));

// connecting to server on port
app.listen(8080, (req, res) => {
  console.log("server is listening");
});

// app.get("/testing", async (req, res) => {
//   const sampleUser = new user({
//     email: "prernabadwane@gmail.com",
//     password: "Pss@1234",
//   });
//   await sampleUser.save();
//   res.send("sucessful");
// });

// app.get("/",(req,res)=>{
//     res.send("i am root");
// });

// signup get
app.get("/", async (req, res) => {
  res.render("users/signin.ejs");
});

// signup post
app.post("/", async (req, res) => {
  const newUser = new user(req.body.user);
  const existUser = await user.findOne({ email: req.body.user.email });
  if (existUser) {
    // give alart
    res.redirect("/");
  } else {
    await newUser.save();
    res.redirect("/home/" + req.body.user.email);
  }
});

// login get
app.get("/login", async (req, res) => {
  res.render("users/login.ejs");
});

// login post
app.post("/login", async (req, res) => {
  const { username, password } = req.body.user;
  const existUser = await user.findOne({ username: username, password: password });
  if (existUser) {
    console.log("User exists");
    res.redirect("/home/" + existUser.email);
  } else {
    console.log("User does not exist");
    res.redirect("/login");
  }
});



// home page for perticular email
app.get("/home/:email", async (req, res) => {
  let { email } = req.params;
  let showUser = await user.findOne({ email: email });
  res.render("users/home.ejs", { showUser: showUser });
});

// anything expecpt correct route 
app.get("*", async (req, res) => {
  res.render("users/signin.ejs");
});


// sent email function using nodemailer to reset password
async function sendResetEmail(email, token) {
  // Create a nodemailer transporter
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "badwaneprerna@gmail.com",
      pass: "ctge fqdm qpbl gunn",
    },
  });

  // Email options
  let mailOptions = {
    from: "prernabadwane@gmail.com",
    to: email,
    subject: "Password Reset",
    text: `To reset your password, click the following link: http://localhost:8080/reset-password/${token}`,
  };

  // Send email
  await transporter.sendMail(mailOptions);
}

// Forgot Password Route - Get Request
app.get("/forgot-password", (req, res) => {
  res.render("users/forgot.ejs");
});

// Forgot Password Route - Post Request
app.post("/forgot-password", async (req, res) => {
  const userEmail = req.body.email;
  const existingUser = await user.findOne({ email: userEmail });
  if (existingUser) {
    // Generate a random token
    const token = crypto.randomBytes(20).toString("hex");

    // Store token with user's email
    passwordResetTokens[userEmail] = {
      token: token,
      createdAt: Date.now(),
    };

    // Send reset email
    await sendResetEmail(userEmail, token);

    res.send("Password reset email sent.");
  } else {
    res.send("User not found.");
  }
});

// Reset Password Route - Get Request
app.get("/reset-password/:token", (req, res) => {
  const token = req.params.token;
  const userEmail = Object.keys(passwordResetTokens).find(
    (key) => passwordResetTokens[key].token === token
  );

  if (
    userEmail &&
    Date.now() - passwordResetTokens[userEmail].createdAt < tokenExpiration
  ) {
    // Pass the token variable to the template
    res.render("users/setpassword.ejs", { token: token, email: userEmail });
  } else {
    res.send("Invalid or expired token.");
  }
});
app.get("/reset-password/:token", (req, res) => {
  const token = req.params.token;
  const userEmail = Object.keys(passwordResetTokens).find(
    (key) => passwordResetTokens[key].token === token
  );

  if (
    userEmail &&
    Date.now() - passwordResetTokens[userEmail].createdAt < tokenExpiration
  ) {
    // Pass the token variable to the template
    res.render("users/setpassword.ejs", { token: token, email: userEmail });
  } else {
    res.send("Invalid or expired token.");
  }
});

// Reset Password Route - Post Request
app.post("/reset-password/:token", async (req, res) => {
  const token = req.params.token;
  const userEmail = Object.keys(passwordResetTokens).find(
    (key) => passwordResetTokens[key].token === token
  );

  if (
    userEmail &&
    Date.now() - passwordResetTokens[userEmail].createdAt < tokenExpiration
  ) {
    const newPassword = req.body.password;

    // Update user's password
    await user.findOneAndUpdate(
      { email: userEmail },
      { password: newPassword }
    );

    // Remove token from storage
    delete passwordResetTokens[userEmail];

    res.send("Password reset successfully.");
  } else {
    res.send("Invalid or expired token.");
  }
});
