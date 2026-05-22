import mongoose  from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const conectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`\nMongoDB Connected !! DB HOST : ${conectionInstance.connection.host}`);//gives connected MongoDB server host info
    } catch (error) {
        console.log("MONGODB connection error: ",error);
        process.exit(1)//app without DB = broken backend
    }
}
export default connectDB