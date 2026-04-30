import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        //upload on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type ="auto"
        })
        //file upload success print console log for url
        console.log("File uploaded on cloudinary", response.url)
        return response;
    } catch (error) {
        //if upload failed we unlink the locally saved file
        fs.unlinkSync(localFilePath)
    }
}

export {uploadCloudinary}