import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ExpressBrute from "express-brute";
import helmet from "helmet";
import Joi from "joi";

const router = express.Router();

var store = new ExpressBrute.MemoryStore();
var bruteforce = new ExpressBrute(store);

router.use(helmet()); // Use helmet

// Specifically set the X-Frame-Options header to DENY or SAMEORIGIN
router.use(helmet.frameguard({ action: "deny" }));

//Sign up
router.post("/signup", async (req, res) => {
    const password = bcrypt.hash(req.body.password,10)
    let newDocument = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        idNumber: req.body.idNumber,
        accountNumber: req.body.accountNumber,
        password: (await password).toString()
    };
    let collection = await db.collection("users");
    let result = await collection.insertOne(newDocument);
    console.log(password);
    res.send(result).status(204)
});

//Login
router.post("/login", bruteforce.prevent, async (req, res) => {
  const { name, password } = req.body;
  console.log(name + " " + password);

  try {
    const collection = await db.collection("users");
    const user = await collection.findOne({ name });

    if (!user) {
      return res.status(401).json({ message: "Authentication failed 🚨" });
    }

    // Compare the provided password with the database password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Authentication failed 🚨" });
    } else {
      //Authentication successful
      const token = jwt.sign(
        { username: req.body.username, password: req.body.password },
        "this_secret_should_be_longer_than_it_is",
        { expiresIn: "1h" }
      );
      res.status(200).json({
        message: "Authentication successfull ✅",
        token: token,
        name: req.body.name,
      });
      console.log("your new token is", token);
    }
  } catch (error) {
    console.error("Login error", error);
    res.status(500).json({ message: "Login Failed 🚫" });
  }
});

export default router;
