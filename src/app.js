import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit:"16KB"}))//without this req.body will be undefined so we use this
app.use(express.urlencoded({extended:true, limit: "16KB"}))//handles form-data/html forms so neccessary also extended true means nested is allowed
app.use(express.static("public"))//for public files tht is it exposes public files
app.use(cookieParser())// for req.cookies


//routes import
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
import commentRouter from './routes/comments.routes.js'

//routes declaration 
app.use("/api/v1/user", userRouter)
app.use("/api/v1/video", videoRouter)
app.use("/api/v1/comment", commentRouter)

// http://localhost:8000/api/v1/user/register(or any)
export{app}// sends to index.js hence server starts there