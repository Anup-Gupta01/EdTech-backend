// const razorpay =require(
const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const { default: mongoose } = require("mongoose");
const mailSender = require("../utils/mailSender");
const { courseEnrollmentEmail } = require("../mail/templates/courseEnrollmentEmail");
const {paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail");
const CourseProgress = require("../models/CourseProgress");
const crypto =require("crypto");
require("dotenv").config();





exports.capturePayment = async(req,res) =>{
    const {courses} =req.body;
    const userId = req.user.id;

    if(!Array.isArray(courses) || courses.length === 0){
        return res.json({success:false, message:
            "Please provide course id"
        });
    }

    let totalAmount =0;
    for(const course_id of courses){
        let course;
        try{
            course = await Course.findById(course_id);
            if(!course){
                return res.status(200).json({success:false,message:"Could not find the course"});
            }
            const uid =new mongoose.Types.ObjectId(userId);
            if( Array.isArray(course.studentEnrolled) &&  course.studentEnrolled.includes(uid)){
                return res.status(200).json({success:false,message:"Student is already Enrolled"});

            }
            totalAmount +=course.price;



        } catch(error){
    console.log(error);
    return res.status(500).json({success:false,message:error.message});
        }
    }



const options ={
    amount : totalAmount*100,
    currency:"INR",
    receipt:Math.random(Date.now()).toString(),
}

    try {
        const paymentResponse = await instance.orders.create(options);
        res.json({
            success: true,
            message: paymentResponse,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Could not initiate order" })

    }


}


//verify the payment

exports.verifyPayment =async(req,res) => {
    const razorpay_order_id =req.body?.razorpay_order_id;
    const razorpay_payment_id =req.body?.razorpay_payment_id;
    const razorpay_signature =req.body?.razorpay_signature;
    const courses =req.body?.courses;
    const userId =req.user.id;

    if(!razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature ||
        !courses || !userId
    ){
        return res.status(200).json({success:false, message:"Payment Failed"});
    }

    let body =razorpay_order_id + "|" +razorpay_payment_id;
    const expectedSignature =crypto.createHmac("sha256",process.env.RAZORPAY_SECRET )
    //  const expectedSignature =crypto.createHmac("sha256",rzp_test_9FTzyvdULdggZ5)
    .update(body.toString())
    .digest("hex");

    if(expectedSignature === razorpay_signature){
        //enroll karwao student ko
        await enrollStudents(courses,userId);

        //return res
        return res.status(200).json({success:true, message:"payment verified"});
    }
    return res.status(200).json({success:false, message:"payment failed"});
}


const enrollStudents =async(courses,userId,res) =>{
    if(!courses || !userId){
        return res.status(400).json({success:false, message:"please provide data for courses or userid"})
    }

    for(const courseId of courses){
        try{
            const enrolledCourse =await Course.findOneAndUpdate(
            {_id:courseId},
            // {$push:{studentEnrolled:userId}},
             {
    $addToSet: {
      studentEnrolled: new mongoose.Types.ObjectId(userId),
    },
  },
            {new:true},
        );

        if(!enrolledCourse){
            return res.status(500).json({success:false,message:"Course not found"});
        }

        const courseProgress = await CourseProgress.create({
            courseID:courseId,
            userId:userId,
            completedVideos: [],
        });

        //find the student and add the coiyrse to their list of enrolledcourse
        const enrolledStudent = await User.findByIdAndUpdate(userId,
            {$push:{
                courses:courseId,
                courseProgress: courseProgress._id,
            }},{new:true}
        );

        //bachhe ko mail send krdo
        const emailResponse =await mailSender(
            enrolledStudent.email,
            `Successfully enrolled into ${enrolledCourse.courseName}`,
            courseEnrollmentEmail(enrolledCourse.courseName, `${enrolledStudent.firstName}`)
        )
        console.log("📩 Full email response:", emailResponse);

        
             console.log("Email sent Successfull",emailResponse?.response);
        
       
        }

        catch(error){
            console.log(error);
            return res.status(500).json({success:false,message:error.message});
        }
        
    }
//      try {
//     const results = [];

//     for (const courseId of courses) {
//       const enrolledCourse = await Course.findOneAndUpdate(
//         { _id: courseId },
//         { $push: { studentEnrolled: userId } },
//         { new: true }
//       );

//       if (!enrolledCourse) {
//         results.push({ courseId, status: "failed", reason: "Course not found" });
//         continue;
//       }

//       const courseProgress = await CourseProgress.create({
//         courseID: courseId,
//         userId: userId,
//         completedVideos: [],
//       });

//       const enrolledStudent = await User.findByIdAndUpdate(
//         userId,
//         {
//           $push: {
//             courses: courseId,
//             courseProgress: courseProgress._id,
//           },
//         },
//         { new: true }
//       );

//       try {
//         const emailResponse = await mailSender(
//           enrolledStudent.email,
//           `Successfully enrolled into ${enrolledCourse.courseName}`,
//           courseEnrollmentEmail(enrolledCourse.courseName, enrolledStudent.firstName)
//         );

//         console.log("📩 Full email response:", emailResponse);
//         results.push({ courseId, status: "success", emailSent: true });
//       } catch (emailError) {
//         console.log("📧 Email sending failed:", emailError.message);
//         results.push({ courseId, status: "enrolled", emailSent: false });
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Enrollment process completed",
//       results,
//     });

//   } catch (error) {
//     console.log("❌ Enrollment error:", error.message);
//     return res.status(500).json({ success: false, message: error.message });
//   }

}


exports.sendPaymentSuccessEmail =async(req,res) =>{
    const {orderId,paymentId,amount} =req.body;

    const userId =req.user.id;
    if(!orderId || !paymentId || !amount || !userId){
        return res.status(400).json({success:false,message:"Please provide all the fields"});
    }

    try{
        //student ko dhundho
        const enrolledStudent =await User.findById(userId);
        await mailSender(
            enrolledStudent.email,
            `Payment Recieved`,
            paymentSuccessEmail(`${enrolledStudent.firstName}`,
                amount/100,orderId,paymentId
            )
        )

    } catch(error){
         console.log("error in sending mail",error)
         return res.status(500).json({success:false,message:"Could not send email"})
    }
}

