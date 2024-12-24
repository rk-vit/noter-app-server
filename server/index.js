import express from "express";
import cors from "cors"
import bodyParser from "body-parser";
import {dirname} from "path";
import { fileURLToPath } from "url";



const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(__dirname+'/public'))
app.use(cors());
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.json())
const port = 3000;
let notes = [];
app.get("/",(req,res)=>{
    res.sendFile(path)
})
app.get("/api",(req,res)=>{
    res.json(notes);
})

app.post("/api",(req,res)=>{
    console.log(req.body);
     notes.push(req.body);
     res.sendStatus(201);
})
app.delete("/api",(req,res)=>{
    const {key} = req.body;
    console.log(key);
    notes.splice(key,1);
    res.sendStatus(204);
})

app.listen(port,(req,res)=>{
    console.log(`server running in port ${port}`)
})