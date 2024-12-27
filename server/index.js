//imports start
import express from "express";
import cors from "cors"
import bodyParser from "body-parser";
import {dirname} from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import bcrypt from "bcryptjs";
import passport from "passport";
import { Strategy } from "passport-local";
import session  from "express-session";
import dotenv from "dotenv"
//imports end

//db things start
dotenv.config();
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});
pool.connect((err) => {
  if (err) {
    console.error("Connection error:", err.stack);
  } else {
    console.log("Connected to the database");
  }
});

//db things ends

//defenitions,initialization starts
const app = express();
// Use session middleware before passport.session
app.use(
    session({
        secret: "TOPSECRET",
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: false, // Set true in production with HTTPS
            sameSite: "lax",
        },
    })
);
app.use(passport.initialize());
app.use(passport.session());
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(__dirname+'/public'))
app.use(cors({
    origin: ['http://localhost:5173', 'https://noterapp.vercel.app','http://localhost:5174'],
    credentials: true,

}));
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.json());
const port = process.env.PORT || 3000;
let notes = [];
const saltRounds = 10;
//defenitions,initialization ends

//SERVE API DOCUMENTATION starts
app.get("/",(req,res)=>{
    res.sendFile(path)
})
//SERVE API DOCUMENTATION ends

// Backend route to check if the user is authenticated
app.get('/auth/protect', (req, res) => {
    if (req.isAuthenticated()) {
      res.status(200).json({ authenticated: true, user: req.user });
    } else {
      res.status(401).json({ authenticated: false });
    }
  });
  

app.post("/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) {
            console.error("Authentication Error:", err);
            return res.sendStatus(500);
        }
        if (!user) {
            console.log("Authentication Failed: User not found");
            return res.sendStatus(401);
        }
        req.login(user, (error) => {
            if (error) {
                console.error("Login Error:", error);
                return  res.sendStatus(500);
            } else {
                console.log("Login Successful");
                res.sendStatus(200);  
            }
        });
    })(req, res, next); // Pass req, res, and next to allow proper flow
});

//encrypted registeration
app.post("/register",async(req,res)=>{
    console.log("User info :- ",req.body);
    const user = req.body.user;
    const name = req.body.name;
    const pass = req.body.pass;
    bcrypt.hash(pass,saltRounds, async(err,hash)=>{
        if(err){
            console.log("Error Hashing the password:-",err);
        }
        else{
            console.log("hashed pass :- ",hash);
            try{
                const result = await pool.query("INSERT INTO users(username,password,name) values($1,$2,$3) RETURNING * " ,[user,hash,name]);
                res.sendStatus(201)
            }catch(error){
                console.log("Error registering in db:- "+error);
            }
        }
    })
})
app.get("/api",async(req,res)=>{
    if(req.isAuthenticated()){
        console.log("Fetching the notes of the user :- ",req.user.id);
        await pool.query("SELECT * FROM notes where u_id = $1",[req.user.id],(err,result)=>{
            if(err){
                console.error("error reading from db:- ",err);
            }else{
                notes = result.rows;
                res.json(notes);
                console.log("Fetched data successfully:- ",notes);
            }
        })
       
    }
})

app.post("/api",async(req,res)=>{
    if(req.isAuthenticated()){   
        console.log(req.body);
        const userid = req.user.id;
        const {title,text} = req.body;
        const query = `INSERT INTO notes(title,text,u_id) values ($1,$2,$3) RETURNING *`;
        const values = [title,text,userid];
        await pool.query(query,values,(err,result)=>{
            if(err){
                console.error("Error pushing in database:- "+err);
            }else{
                console.log("Saved to db"); 
                notes.push(result.rows[0]);
                console.log(result.rows);
            }
        })
        res.sendStatus(201);
    }else{
        console.log("User is not authenticated");
    }
})
app.delete("/api",(req,res)=>{
    const val = req.body.key;
    console.log(req.body.key);
    console.log("Delete initiated");
    console.log("to delete key:-"+val);
    pool.query('DELETE from notes where id = $1',[val],(err,result)=>{
        if(err){
            console.error("Error deleting from database:- "+err);
        }else{
            console.log("deleted from db"); 
        }
    })
    notes = notes.filter(note=>note.id !==val);
    res.sendStatus(204);
})


//Passport local Startegy

passport.use(new Strategy(async (username, password, cb) => {
    try {
        const result = await pool.query("SELECT * FROM users WHERE username=$1", [username]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const storedHash = user.password;
            
            console.log("User found, comparing passwords...");

            bcrypt.compare(password, storedHash, (err, compResult) => {
                if (err) {
                    console.error("Error comparing passwords:", err);
                    return cb(err); // Pass error to callback
                }

                if (compResult) {
                    console.log("Password match successful");
                    return cb(null, user); // Authentication successful
                } else {
                    console.log("Password mismatch");
                    return cb(null, false); // Password doesn't match
                }
            });
        } else {
            console.log("User not found");
            return cb(null, false); // No user found
        }
    } catch (err) {
        console.error("Error in database query:", err);
        return cb(err); // Return the database query error
    }
}));


passport.serializeUser((user,cb)=>{
    console.log("Serializing: "+user.username+" "+user.password);
    cb(null,user);
})

passport.deserializeUser((user,cb)=>{
    console.log("DeSerializing"+user);
    cb(null,user);
})
//passport local startegy



//Listening for requests
app.listen(port,(req,res)=>{
    console.log(`server running in port ${port}`)
})
//Listening for requests
