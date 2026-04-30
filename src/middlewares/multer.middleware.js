import multer, { diskStorage, memoryStorage } from "multer";


// two types of storage diskStorage and memoryStorage use diskStorage to handle large size files
const storage = multer.diskStorage({
    destination: function (req,file,cb) {
        cb(null, "./public/temp")
    },
    filename: function (req,file,cb) {
        cb(null,file.originalname)
    }
})

export const upload = multer({
    storage,
})