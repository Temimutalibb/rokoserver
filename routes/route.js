const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const SALT_WORK_FACTOR = 10;
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const authenticateToken = require("./middleware");

dotenv.config();

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

UserSchema.pre("save", function (next) {
  const user = this;
  if (!user.isModified("password")) return next();

  bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, function (err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

const User = mongoose.model("User", UserSchema);

router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("exist");
      return res.status(400).json({ message: "Email already exists" });
    }
    const newUser = new User({ email, password });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully, Login" });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Server error, try again" });
  }
});

// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log({ email, password });

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log("email error");
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("password errror");
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.status(200).json({ message: "Login successful", token, email });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Server error, try again" });
  }
});

const noteSchema = new mongoose.Schema({
  email: String,
  tab: [
    {
      id: String,
      title: String,
      value: String,
      note: String,
    },
  ],
});

const Note = mongoose.model("notes", noteSchema);

router.post("/savenote", async (req, res) => {
  const { tab, email } = req.body;
  console.log(tab, email);
  try {
    const noteExist = await Note.findOne({ email });

    if (noteExist) {
      console.log(noteExist);
      noteExist.tab = tab;
      await noteExist.save();
      res.json(noteExist);
    } else {
      const newTaskList = new Note({ email, tab: [tab] });
      await newTaskList.save();
      res.json(newTaskList);
    }
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Server error, try again" });
  }
});

router.post("http://localhost:4000/getdata", async (req, res) => {
  const { email } = req.body;
  try {
    const noteExist = await Note.findOne({ email });
    if (noteExist) {
      console.log(noteExist.tab);
      res.send(noteExist.tab);
    }
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Server error, try again" });
  }
});
module.exports = router;
