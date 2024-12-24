import express from "express";
import cors from "cors"
import bodyParser from "body-parser";
const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.json())
const port = 3000;
let notes = [];
app.get("/",(req,res)=>{
    res.json(notes);
})

app.post("/",(req,res)=>{
    console.log(req.body);
     notes.push(req.body);
     res.sendStatus(201);
})
app.delete("/",(req,res)=>{
    const {key} = req.body;
    console.log(key);
    notes.splice(key,1);
    res.sendStatus(204);
})

app.listen(port,(req,res)=>{
    console.log(`server running in port ${port}`)
})