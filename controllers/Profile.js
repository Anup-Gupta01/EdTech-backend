const Profile = require("../models/Profile");
const CourseProgress = require("../models/CourseProgress");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const { convertSecondsToDuration } = require("../utils/secToDuration");
const Course = require("../models/Course");

exports.updateProfile = async (req, res) => {
  try {
    //get data
    const { dateOfBirth = "", about = "", contactNumber, gender } = req.body;
    //get userid
    const id = req.user.id;
    //vaildation
    if (!contactNumber || !gender || !id) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    //find profile
    const userDetails = await User.findById(id);

    const profileId = userDetails.additionalDetails;
    const profileDetails = await Profile.findById(profileId);

    //update profile
    profileDetails.dateOfBirth = dateOfBirth;
    profileDetails.about = about;
    profileDetails.gender = gender;
    profileDetails.contactNumber = contactNumber;
    await profileDetails.save();
    //return response
    return res.status(200).json({
      success: true,
      message: 'Profile Updated Successfully',
      profileDetails,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};


//delete account

exports.deleteAccount = async (req, res) => {
  try {

    //get id
    const id = req.user.id;
    console.log("printing user id:", id);
    //validation
    const userDetails = await User.findById(id);
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: 'usernot found',
      });
    }
    //delete profile
    await Profile.findByIdAndDelete({ _id: userDetails.additionalDetails });
    //ToDo:Hw unenroll user from all enrolled courses
    //delete user
    await User.findByIdAndDelete({ _id: id });

    //return response
    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    })



  } catch (error) {
    return res.status(500).json({
      success: false,
      // error:error.message,
      message: 'User cannot be deleted',
    });
  }
};


//ger all user details
exports.getAllUserDetails = async (req, res) => {
  try {
    //get user id
    const id = req.user.id

    //validation and get user details
    const userDetails = await User.findById(id).populate("additionalDetails").exec();
    //return response
    return res.status(200)
      .json({
        success: true,
        message: 'user data fetched succesfully',
        data: userDetails,

      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


//update display picture
exports.updateDisplayPicture = async (req, res) => {
  try {
    const displayPicture = req.files.displayPicture
    const userId = req.user.id
    const image = await uploadImageToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    )
    console.log(image)
    const updatedProfile = await User.findByIdAndUpdate(
      { _id: userId },
      { image: image.secure_url },
      { new: true }
    )
    res.send({
      success: true,
      message: `Image Updated successfully`,
      data: updatedProfile,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
};

exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id
    let userDetails = await User.findOne({
      _id: userId,
    })
      .populate({
        path: "courses",
        populate: {
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        },
      })
      .exec()

    userDetails = userDetails.toObject()
    var SubsectionLength = 0
    for (var i = 0; i < userDetails.courses.length; i++) {
      let totalDurationInSeconds = 0
      SubsectionLength = 0
      for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
        totalDurationInSeconds += userDetails.courses[i].courseContent[
          j
        ].subSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0)
        userDetails.courses[i].totalDuration = convertSecondsToDuration(
          totalDurationInSeconds
        )
        SubsectionLength +=
          userDetails.courses[i].courseContent[j].subSection.length
      }
      let courseProgressCount = await CourseProgress.findOne({
        courseID: userDetails.courses[i]._id,
        userId: userId,
      })
      courseProgressCount = courseProgressCount?.completedVideos.length
      if (SubsectionLength === 0) {
        userDetails.courses[i].progressPercentage = 100
      } else {
        // To make it up to 2 decimal point
        const multiplier = Math.pow(10, 2)
        userDetails.courses[i].progressPercentage =
          Math.round(
            (courseProgressCount / SubsectionLength) * 100 * multiplier
          ) / multiplier
      }
    }

    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find user with id: ${userDetails}`,
      })
    }
    return res.status(200).json({
      success: true,
      data: userDetails.courses,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}





exports.instructorDashboard = async (req, res) => {
  try {

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated or user ID is missing.",
      });
    }

    let courseDetails;
    try {
     
      courseDetails = await Course.find({ instructor: req.user.id });
    } catch (dbError) {
      
      console.error("DATABASE_QUERY_ERROR in instructorDashboard:", dbError);

      return res.status(500).json({
        success: false,
        message: "A database error occurred while fetching courses."
      });
    }


    if (!courseDetails || courseDetails.length === 0) {
        return res.status(200).json({ 
            success: true,
            message: "No courses found for this instructor.",
            courses: [] 
        });
    }

    
    const courseData = courseDetails.map((course) => {
      const totalStudentsEnrolled = course.studentEnrolled?.length || 0;
      const totalAmountGenerated = totalStudentsEnrolled * (course.price || 0);

      const courseDataWithStats = {
        _id: course._id,
        courseName: course.courseName,
        courseDescription: course.courseDescription,
        price: course.price || 0,
        totalStudentsEnrolled,
        totalAmountGenerated,
      };
      return courseDataWithStats;
    });

    res.status(200).json({ 
        success: true,
        courses: courseData 
    });

  } catch (error) {
 
    console.error("UNEXPECTED_INSTRUCTOR_DASHBOARD_ERROR", error);
    res.status(500).json({ 
        success: false,
        message: "Internal Server Error. Could not process dashboard data." 
    });
  }
};
