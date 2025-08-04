const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const mongoose=require("mongoose");

//creeate rating
exports.createRating = async (req, res) => {
    try {
        //get userid
        const userId = req.user.id;


        //fetch data from req body
        const { rating, review, courseId } = req.body;
        //check if user is enrolled or not
        
        const courseDetails = await Course.findOne({
            _id: new mongoose.Types.ObjectId(courseId),
  studentEnrolled: new mongoose.Types.ObjectId(userId),
        });


        console.log("Type of userId:", typeof userId);
        console.log("userId:", userId);
        const course = await Course.findById(courseId);
        console.log("studentsEnrolled:", course?.studentEnrolled);


        console.log("dekh lo course details me kya hai",courseDetails)

        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                messagee: "Studdent is not enrolled in the course",
            });
        }

        //check if already reviewed thecourse
        const alreadyReviewed = await RatingAndReview.findOne({
            user: userId,
            course: courseId,
        });

        if (alreadyReviewed) {
            return res.status(403).json({
                success: false,
                messagee: 'Course is already reviewed by the user',
            });
        }

        //create rating review
        const ratingReview = await RatingAndReview.create({
            rating, review,
            course: courseId,
            user: userId,
        });

        //attach to course with this rating

        const updatedCourseDetails = await Course.findByIdAndUpdate({ _id: courseId }, {
            $push: {
                ratingAndReviews: ratingReview._id,
            }
        },
            { new: true });
        console.log(updatedCourseDetails);

        //return res
        return res.status(200).json({
            success: true,
            message: "Rating and Review Successfully",
            updatedCourseDetails,
        })


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
};

//get averagerating\

exports.getAverageRating = async (req, res) => {
    try {
  // get course id
  const courseId =req.body.courseId;

  //calculate average rating 
  const result =await RatingAndReview.aggregate([
    {
        $match:{
            course:new mongoose.Types.ObjectId(courseId),
        }, 
    },
    {
      $group :{
        _id:null,
        averageRating:{$avg: "$rating"},
      }   
    }
  ])


  //return rating
  if(result.length >0){
    return res.status(200).json({
        success:true,
        averageRating:result[0].averageRating,
    })
  }

  //if no ratingAndreview exist
    return res.status(200).json({
        success:true,
        message:'Average rating 0, no rating given till now',
        averageRating:0,
    })


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

//getallrating
exports.getAllRating =async (req,res) =>{
    try{
        const allReviews = await RatingAndReview.find({})
            .sort({rating:"desc"})
            .populate({
                path:"user",
                select :"firstName lastName  email image",

            })
            .populate({
                path:"course",
                select:"courseName",
            })
            .exec();
      
    return res.status(200).json({
        success:true,
        message:"All reviews fetched successfully",
        data:allReviews,
    });

    } catch(error){
         return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

