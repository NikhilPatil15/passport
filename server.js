import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import passport from "passport";
import GoogleStratergy from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { authmiddleware } from "./authmiddleware.js";

const jwtSecret = process.env.JWT_SECRET;

passport.use(
  new GoogleStratergy(
    {
      clientID: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    (token,refreshToken,profile,cb) => {
      // Create JWT payload
      try {
        console.log("Profile: ", profile);
        console.log("AccessToken:", 
            token, 
            "Refresh Token: ", refreshToken);
        
        const payload = {
            id: profile.id,
            displayName: profile.displayName,
            emails: profile.emails,
          };
          // Sign JWT
          const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: "1h" });
          return cb(null, accessToken);
      } catch (error) {
        console.log("error: ", error);
      }


    }
  )
);

const app = express();

dotenv.config({
  path: "./env",
});

app.use(cookieParser());

async function connectDB() {
  try {
    const connectionString = await mongoose.connect(
      `${process.env.MONGODB_URL}/videoHub`
    );
    console.log(
      `\n MongoDb Connected DB Host: ${connectionString.connection.host}`
    );
  } catch (error) {
    console.log("CONNECTION ERROR: ", error);
    process.exit(1);
  }
}

connectDB();

const port = process.env.PORT || 3000;

app.use(passport.initialize());

app.get("/", (req, res) => {
  res.send(`<a href="/auth/google"> Authenticate with google </a>`);
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    // console.log("User: ",req.user);
    res.cookie({accessToken:req.user}).redirect(`/profile?token=${req.user}`);
  }
);

app.get("/profile",(req,res)=>{
    const {token} = req.query

    jwt.verify(token,jwtSecret,(err,user)=>{
        if(err)
            res.status(401).send("Invalid token")
        res.send(`user: ${user.displayName}`)

        console.log("User:", user);
    })
});
// app.use((err, req, res, next) => {
//     console.error('Error encountered:', err);
//     res.status(500).send('Internal Server Error');
//   });

app.listen(port, () => {
  console.log(`Server is serving on http://localhost:${port}`);
});
