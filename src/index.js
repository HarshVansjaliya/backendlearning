// require('dotenv').config({path:'./env'})

import dotenv from "dotenv"

import connectDB from './db/databaseConnect.js';
import app from "./app.js";
dotenv.config({ 
    path: './env'
}); // Load environment variables from.env file.


await connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("error is",error);
        throw error;
        
       })
    app.listen(process.env.PORT ||8000,()=>{
        console.log(`Connecting to ${process.env.PORT}`);
        
    })
    console.log("MongoDB Connected...");
 
})
.catch((err)=>{
    console.log("mongodb connection  error: ",err);
    
})





/*
import mongoose from "mongoose";
import {DB_NAME} from "./constants";
import express from "express";
const app = express();
(async () => {
    try {
       await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
       app.on("error",(error)=>{
        console.log("error is",error);
        throw error;
        
       })
       app.listen(process.env.PORT,()=>{
        console.log(`listening on port${process.env.PORT}`);
        
       })
    }
    catch(error){
        console.error("error is",error);
        throw error
    }
})()
    */

