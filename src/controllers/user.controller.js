import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import uploadFileToCloudinary from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // return res.status(202)
  // .json({message:"Welcome"})

  // step for how to user register
  // 1. get user from frontend
  // 2. validation on all the entered fields
  // 3. check if ue is already exists: check user using username and email
  // 4. check for images, check for avatar
  // 5. upload image to cloudinary, check avatar is uploaded or not
  // 6. create user object - create entry in DB
  // 7. remove password and refresh token fields from response
  // 8. check for user creation
  // 9. return response

  // 1. get user details from frontend

  // data form mathi k json ma data aave to direct body mathi madi jai

  const { userName, email, fullName, password } = req.body;

  console.log("userName: " + userName);
  console.log("email: ", email);
  console.log("fullName: ", fullName);
  console.log("password: ", password);

  // 2. validation
  if (userName === "") {
    throw new ApiError(400, "User name is required");
  }
  if (email === "") {
    throw new ApiError(400, "Email is required");
  }
  if (fullName === "") {
    throw new ApiError(400, "Full Name is required");
  }
  if (password === "") {
    throw new ApiError(400, "Password is required");
  }

  // uper na badha if no lakhva hoi tena mate nu sortcut

  // if(
  //     [fullName, email, password,userName].some(
  //         (field)=> field?.trim() === ""

  //     )
  // )
  // {
  //     throw new ApiError(400,"all fields required")
  // }

  // 3. check if user is already exists

  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User name or email already exists");
  }

  // 4. check for images, check for avatar

  // req.body ma file sivay no badho data aave

  // multer file nu access aape
  const filedescription = req.files;
  console.log("image file description: ", filedescription);

  const avatarLocalPath = req.files?.avatar[0]?.path;

  //  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
    console.log("cover image path: " + coverImageLocalPath);
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  // 5. upload image to cloudinary, check avatar is uploaded or not

  const avatar = await uploadFileToCloudinary(avatarLocalPath);
  const coverImage = await uploadFileToCloudinary(coverImageLocalPath);

  //check avtar is uploaded or not
  if (!avatar) {
    throw new ApiError(400, "Avatar image is required");
  }

  // 6. create user object - create entry in DB

  const user = await User.create([
    {
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      userName: userName.toLowerCase(),
      email,
      password,
    },
  ]);
  console.log("user Details", user);

  // 7.  remove password and refresh token fields from response

  //  const createdUser = await User.findById(user._id).select(
  //      "-password -refreshToken"

  //  )
  let createdUser;
  try {
    createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    if (!createdUser) {
      throw new ApiError(500, "User not found");
    }
    console.log("created user is ...", createdUser);
  } catch (error) {
    console.error("Error fetching user:", error.message);
  }

  // 8. check for user creation

  // if(!createdUser){
  //     console.log("failed to create user");
  //     throw new ApiError(500, "Failed to create user due to something went wrong in server");

  // }

  // 9. return response

  // return karvani 2 type

  // 1. return res.status(200).json({createdUser})

  // 2.
  return res
    .status(201)
    .json(new ApiResponse(200, "user registered successfully", createdUser));

  // const loginUser=asyncHandler( async(req, res) => {
  //     return res.status(202)
  //     .json({message:"Login Successful"})
  // });
});

const loginUser = asyncHandler(async (req, res) => {
  //step for login user
  // 1. get user from frontend - req.body
  // 2. check username or email
  // 3. find user by email or username
  // 4. password match to username or email
  // 5. generate access and refresh  token
  // 6. send cookie
  // 7. return response

  const { userName, email, password } = req.body;
  console.log("login username: ", userName);
  console.log("login email: ", email);
  console.log("login password: ", password);

  if (!userName && !email) {
    throw new ApiError(400, "userName or email is required");
  }
  if (!(userName || email)) {
    throw new ApiError(400, "userName or email is required");
  }

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, " invalid password ");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //send cookie

  // using httpOnly and secure not modified cookie in frontend , modify possible in server
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged In  successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const inComingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!inComingRefreshToken) {
    throw new ApiError(401, "unAuthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      inComingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (inComingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token is expired ");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    // const refreshedUser = await User.findById(user._id).select("-password -refreshToken")
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "accessToken refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  // get or find  user_id from User
  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;

  await user.save({
    validateBeforeSave: false,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "FullName and email are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "user account details updated successfully")
    );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  const avatar = await uploadFileToCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "error while  uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  //write utils function for  delete old image from cloudinary
  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar Image Updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const CoverImageLocalPath = req.file?.path;

  if (!CoverImageLocalPath) {
    throw new ApiError(400, "cover image file is missing");
  }

  const coverImage = await uploadFileToCloudinary(CoverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "error while  uploading on cover image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage Updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;

  if (!userName?.trim()) {
    throw new ApiError(400, "userName is missing");
  }

  // User.find({ userName})

  const channel = await User.aggregate([
    {
      $match: {
        userName: userName?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        email: 1,
      },
    },
  ]);

  console.log("channel details is ...", channel);

  if (!channel?.length) {
    throw new ApiError(404, "Channel not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "Channel fetched successfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },

    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    userName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },

          {
            $addFields: {
              owner: {
                // $arrayElemAt:["$owner",0]
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);
  
  // console.log("watch history details",res);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0]?.watchHistory,
        "Watch History fetched successfully"
      )
    );

    
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
