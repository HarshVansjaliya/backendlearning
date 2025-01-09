import asyncHandler from "../utils/asyncHandler.js";

const registerUser= asyncHandler( (async(req,res) => {
    return res.status(202)
    .json({message:"Welcome"})
}))

const loginUser=asyncHandler( async(req, res) => {
    return res.status(202)
    .json({message:"Login Successful"})
});


export {registerUser,loginUser};