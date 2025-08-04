const Section = require("../models/Section");
const Course = require("../models/Course");
const SubSection = require("../models/SubSection");


exports.createSection = async (req, res) => {
    try {

        //data fetch
        const { sectionName, courseId } = req.body;


        //data validation
        if (!sectionName || !courseId) {
            return res.status(400).json({
                success: false,
                message: 'Missing Properties',
            });
        }

        // create section
        const newSection = await Section.create({ sectionName});
        //update course with section objectid
        const updatedCourseDetails = await Course.findByIdAndUpdate(
            courseId,
            {
                $push: {
                    courseContent: newSection._id,
                }
            },
            { new: true },
        )
        .populate({
            path: "courseContent",
            populate:{
                path: "subSection",
            },
        })
        .exec();
        //HW: use populate to replace section and subsection  both iin the updatedcoursedetails

        //return response
        return res.status(200).json({
            success: true,
            message: 'Section created successfully ',
             updatedCourse: updatedCourseDetails,
        })


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "unable to create section please try again",
            error: error.message,
        });
    }
};

//update  section
exports.updateSection = async (req, res) => {
    try {

        //daata fetch
        const { sectionName, sectionId ,courseId} = req.body;

        const section =await Section.findByIdAndUpdate(
            sectionId,
            { sectionName},
            {new:true}
        );

        //validate
        if (!sectionName || !sectionId) {
            return res.status(400).json({
                success: false,
                message: 'Missing Properties',
            });
        }

        //update data
        // const section = await Section.findByIdAndUpdate(sectionId, { sectionName }, { new: true });

        const course = await Course.findById(courseId)
		.populate({
			path:"courseContent",
			populate:{
				path:"subSection",
			},
		})
		.exec();

        //response 
        res.status(200).json({
            success: true,
            message: section,
            data:course,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "unable to update section please try again",
            error: error.message,
        });
    }
};


exports.deleteSection = async (req, res) => {
    try {


        //get id
        const {sectionId, courseId} =req.body;

        await Course.findByIdAndUpdate(courseId, {
			$pull: {
				courseContent: sectionId,
			}
		})


        //use find by id and delete
      const section =  await Section.findByIdAndDelete(sectionId);
      console.log(sectionId,courseId);
      
      if(!section){
        return res.status(404).json({
            success:false,
            message:"Section not found",
        })
      }

     //TODO[testing]: do we need to delete the entry from the courrse schema??
        
     //delete sub section
       await SubSection.deleteMany({_id:{$in: section.subSection}});

    //    await Section.findByIdAndDelete(sectionId);
        
      //find the updated course and return
      const course =await Course.findById(courseId).populate({
        path:"courseContent",
        populate:{
            path:"subSection"
        }
      })
      .exec();
     

        res.status(200).json({
            success:true,
            message:"section deleted successfully ",
            data:course
        });

    } catch (error) {
        console.error("Error deleting section:", error);
        return res.status(500).json({
            success: false,
            message: "unable to delete section please try again",
            error: error.message,
        });
    }
}