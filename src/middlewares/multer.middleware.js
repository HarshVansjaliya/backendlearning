import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-'+file.originalname);
        cb(null, file.originalname);
        console.log("file details is " + file);
        
    }
});

export const upload = multer({
    storage:storage
})