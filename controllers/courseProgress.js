const CourseProgress = require("../models/CourseProgress");
const SubSection = require("../models/SubSection");



exports.updateCourseProgress = async (req, res) => {
    const { courseId, subSectionId } = req.body;

    const userId = req.user.id;
    try {
        //check  if sybseection is valid
        const subSection = await SubSection.findById(subSectionId);

        if (!subSection) {
            return res.status(404).json({ error: "Invalid SubSection" });

        }

        //checck for old entry
        let courseProgress = await CourseProgress.findOne({
            courseID: courseId,
            userId: userId,
        });

        if (!courseProgress) {
            return res.status(404).json({
                success: false,
                message: "COurse progress does not exist"
            });

        }
        else {
            //check for e-completing video/subsection
            if (courseProgress.completedVideos.includes(subSectionId)) {
                return res.status(400).json({
                    error: "Subsection already completed",
                });
            }

            // push into completed videocourse

            courseProgress.completedVideos.push(subSectionId);

        }

        await courseProgress.save();
        return res.status(200).json({
            success:true,
            message:"Course Progress updated Successfully",
        })
    } catch (error) {
        console.error(error);
        return res.status(400).json({ error: "Internal servevr error" });
    }
}