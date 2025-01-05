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
      return res.json({ message: "Email already exists" });
    }
    const newUser = new User({ email, password });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully, Login" });
  } catch (error) {
    res.status(500).json({ message: "Server error, try again" });
  }
});

// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ message: "Invalid email or password" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    return res.status(200).json({ message: "Login successful", token, email });
  } catch (error) {
    res.status(500).json({ message: "Server error, try again" });
  }
});

const noteSchema = new mongoose.Schema({
  email: { type: String, required: true },
  tab: [
    {
      id: { type: String },
      title: { type: String },
      value: { type: String },
      note: { type: [String], required: true },
      inviteLink: { type: [String] },
    },
  ],
});

const Note = mongoose.model("notes", noteSchema);

router.post("/savenote", async (req, res) => {
  const { tab, email } = req.body;
  try {
    const noteExist = await Note.findOne({ email });

    if (noteExist) {
      noteExist.tab = tab;
      await noteExist.save();
      res.json(noteExist);
    } else {
      const newTaskList = new Note({ email, tab: [tab] });
      await newTaskList.save();
      res.json(newTaskList);
    }
  } catch (error) {
    res.status(500).json({ message: "Server error, try again" });
  }
});

router.post("/getdata", async (req, res) => {
  const { email } = req.body;
  try {
    const noteExist = await Note.findOne({ email });
    if (noteExist) {
      res.send(noteExist.tab);
    }
  } catch (error) {
    res.status(500).json({ message: "Server error, try again" });
  }
});

router.post("/invite", async (req, res) => {
  const { id, email, edit } = req.body;
  const randomNumber = Math.floor(Math.random() * 1000000) + 1;
  const inviteLink = id;
  const theValue = [inviteLink, edit];
  console.log(id);

  try {
    const result = await Note.findOneAndUpdate(
      { email, "tab.id": id },
      { $set: { "tab.$.inviteLink": theValue } },
      { new: true, upsert: true }
    );
    await result.save();
    return res.json({ invite: "link generated sucess fully" });
  } catch (error) {
    res.status(500).json({ message: "Server error, try again" });
  }
});

router.post("/getlink", async (req, res) => {
  const { inviteLink } = req.body;

  try {
    const noteExist = await Note.findOne({
      tab: { $elemMatch: { inviteLink: inviteLink } },
    });
    if (noteExist) {
      console.log(noteExist.email);
      res.send({ tab: noteExist.tab, email: noteExist.email });
    } else {
    }
  } catch (error) {
    res.status(500).json({ message: "Server error, try again" });
    console.log(error);
  }
});

router.post("/saveinvite", async (req, res) => {
  const { email, id, note, title } = req.body;
  console.log(title);

  try {
    const query = { email: email, "tab.id": id };
    const updateDocument = {
      $set: { "tab.$.note": note, "tab.$.title": title },
    };

    const result = await Note.updateOne(query, updateDocument);
    if (result.matchedCount === 1) {
      console.log("Successfully updated the note.");
    } else {
      console.log("No matching document found.");
    }
  } catch (error) {}
});
module.exports = router;
