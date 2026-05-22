// require('dotenv').config({path: './env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import {app} from "./app.js"

dotenv.config({
    path: './env'
})

connectDB()//accept it as a promise bcs if we do directly app.listen and there is db fail: server accepts req but not proccesed thru db
.then( () => {
    app.listen(process.env.PORT || 4000, () =>{
        console.log(`Server is running at port : ${process.env.PORT}`)
    })
})
.catch((err) => {
    console.log("MONGODB connection failed !! ", err); //error handling if async failed
})







/*
import express from express

const app = express()

( async () => {
    try {
       await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
       app.on("error", (error) => {
        console.log("ERROR: ",error)
        throw error
       })
       app.listen(process.env.PORT, () => {
        console.log(`app is listening on port ${process.env.PORT}`)
       })
       
    } catch (error) {
        console.error("ERROR: ",error)
        throw err
    }
})()
*/