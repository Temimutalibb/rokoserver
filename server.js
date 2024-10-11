const express = require("express");
const app = express();
var mongoose = require("mongoose");
require("dotenv").config();
const { MONGO_URL, PORT } = process.env;
const cors = require("cors");
const port = 4000;
const route = require("./routes/route");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
mongoose
  .connect(
    "mongodb+srv://michaelgreenerside:bxG0ZisfIP895l2M@cluster0.4gpel.mongodb.net/local_library?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use("/", route);

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (authHeader) {
    const token = authHeader.split(" ")[1]; // Extract token from 'Bearer token'

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403); // Invalid token
      }

      req.user = user; // Attach user to the request object
      next();
    });
  } else {
    res.sendStatus(401); // No token found
  }
};

app.get("/protected", authenticateJWT, (req, res) => {
  res.json({ message: "Token is valid!", user: req.user });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

/*
 const token = authHeader.split(" ")[1]; // Extract token from 'Bearer token'
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      res.json({ message: "this token is valid", user: req.user });
    });
    */
