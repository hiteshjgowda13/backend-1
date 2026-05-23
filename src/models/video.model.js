import mongoose ,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema =  new Schema(
    {
        videoFile:{
            type: String, //cloudaniry url
            required: true,
        },
        thumbnail:{
            type:String,//cloudaniray url
            required:true
        },
        title:{
            type:String,
            required:true,
            trim:true
        },
        description:{
            type:String,
            required:true,
            trim:true
        },
        duration:{
            type:Number, //cloudaniray gives duration when video is uploaded
            required:true
        },
        views:{
            type:Number,
            default:0
        },
        isPublished:{
            type:  Boolean,
            default: true
        },
        owner: {
            type:Schema.Types.ObjectId,
            ref: "User"
            /* Video.findById(id).populate("owner","selected fields"):
            returns 
            "owner": {
                "_id":"abc123",
                "username":"hitesh",
                "email":"..."
             } */
        }
    },
    {
        timestamps: true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video",videoSchema)