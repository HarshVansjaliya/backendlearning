import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadFileToCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) return null

        //uploadFileToCloudinary
        const response = await cloudinary.uploader.upload
        (localFilePath,{
            resource_type: "auto"
        })
        //upload successfully upload
        console.log("file is uploaded to cloudinary no response",response)
        console.log("file url path ",response.url);
        
        return response;
        
    }
    catch(error){
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got rejected
        return null;
    }
}

export default uploadFileToCloudinary