import mongoose,{mongo, Schema} from "mongoose";

const likeSchema = new Schema({
    video:{
        type:mongoose.Types.ObjectId,
        ref:"Video"
    },
    comment:{
        type:mongoose.Types.ObjectId,
        ref:"Comment"
    },
    likedBy:{
        type:mongoose.Types.ObjectId,
        ref:"User"
    },
    tweets:{
        type:mongoose.Types.ObjectId,
        ref:"Tweet"
    },
},{timestamps:true})

export const Like = mongoose.model("Like",likeSchema)