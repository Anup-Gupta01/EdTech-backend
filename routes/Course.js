//import the required modlue
const express = require("express")
const router = express.Router()

//import the controller

//course controller import
const {
    createCourse,
    showAllCourses,
    getCourseDetails,
    getFullCourseDetails,
    editCourse,
     getInstructorCourses,
  deleteCourse,
 } = require("../controllers/Course")

 //categories controller import

 const {
    showAllCategories,
    createCategory,
    categoryPageDetails,
 } =require("../controllers/Category");

 //section controllers import

 const {
 createSection,
 updateSection,
 deleteSection,
 } =require("../controllers/Section");

//subsection controllers import
const {
    createSubSection,
    updateSubSection,
    deleteSubSection,
} =require("../controllers/Subsection")

//rating controller import
const {
    createRating,
    getAverageRating,
    getAllRating,
    
} = require("../controllers/RatingAndReview");


const {
    updateCourseProgress,
}=require("../controllers/courseProgress");

//import middleware
const {auth,isInstructor,isStudent, isAdmin} =require("../middlewares/auth");


//course can be created by instructor
router.post("/createCourse",auth,isInstructor,createCourse);

//add a section to a course
router.post("/addSection",auth,isInstructor,createSection)

//update section
router.post("/updateSection",auth,isInstructor,updateSection)
//delete section
router.post("/deleteSection",auth,isInstructor,deleteSection)

//update subsection
router.post("updateSubSection",auth,isInstructor,updateSubSection)
//delete subsection
router.post("/deleteSubSection",auth,isInstructor,deleteSubSection)

//add a subsection to a section
router.post("/addSubSection",auth,isInstructor,createSubSection)

router.get("/showAllCourses", showAllCourses);

// Get all Courses Under a Specific Instructor
router.get("/getInstructorCourses", auth, isInstructor, getInstructorCourses)
// Delete a Course
router.delete("/deleteCourse", deleteCourse)

router.post("/updateCourseProgress", auth,isStudent,updateCourseProgress);


router.post("/getCourseDetails", getCourseDetails);

router.post("/getFullCourseDetails", auth, getFullCourseDetails)

router.post("/editCourse", auth, isInstructor, editCourse)

router.post("/createCategory", auth, isAdmin, createCategory);
router.get("/showAllCategories", showAllCategories);
router.post("/getCategoryPageDetails", categoryPageDetails);






//rating and review

router.post("/createRating",auth,isStudent,createRating)
router.get("/getAverageRating",getAverageRating)

router.get("/getAllRating",getAllRating)

module.exports =router