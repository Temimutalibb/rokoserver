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
  console.log({ email, password });

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
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Server error, try again" });
  }
});

/*router.get("/protected", authenticateToken, (req, res) => {
  res.status(200).json({ message: "This is a protected route" });
});
*/
module.exports = router;
