import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken, changeCurrentPassword, getcurrentUser, updateDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)//checked


router.route("/login").post(loginUser)//checked


//secured routes
router.route("/logout").post(verifyJWT, logoutUser)//checked
router.route("/refresh-token").post(refreshAccessToken)//checked only works if user is loggedin so jwt is required?
router.route("/change-password").post(verifyJWT,changeCurrentPassword)//checked works fine 
router.route("/current-user").get(verifyJWT,getcurrentUser)//checked 
router.route("/update-details").patch(verifyJWT,updateDetails)//checked
router.route("/avatar-change").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)//checked 
router.route("/coverImage-change").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)//checked
router.route("/c/:username").get(verifyJWT,getUserChannelProfile) //since its coming from param we use /c/:
//above route works
router.route("/history").get(verifyJWT,getWatchHistory)

export default router