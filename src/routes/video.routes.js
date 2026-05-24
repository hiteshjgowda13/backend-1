import {Router} from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js'
import  {
    uploadVideo,
    getSingleVideo,
    getAllVideos,
    updateVideoDetails,
    deleteVideo,
    togglePublicStatus
} from '../controllers/video.controller.js'    

const router = Router();

// router.route("/c/:videoId").get(getSingleVideo)
router.route("/").get(getAllVideos) //since its coming from query we use /?search=abc


//secured routes: only logged in user can do this
router.route("/upload-video").post(
    verifyJWT,
    upload.fields([ //fields required since this cant be accessed thru body params after this middle ware we send controller
        {
            name:"videoFile",
            maxCount:1
        },
        {
            name:"thumbnail",
            maxCount:1
        }
    ]),
    uploadVideo
)
// router.route("/uploadVideo/c/:videoId").patch(verifyJWT,upload.single("thumbnail"),updateVideoDetails)

router.route("/:videoId")
.get(getSingleVideo)
.patch(
    verifyJWT,
    upload.single("thumbnail"),
    updateVideoDetails
)


router.route("/toggle/publish/:videoId").post(verifyJWT,togglePublicStatus)

export default router;