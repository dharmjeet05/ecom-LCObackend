const BigPromise = require("../middlewares/bigPromise");

exports.home = BigPromise(async (req, res) => {
    // const db = await somethin()
    res.status(200).json({
        success: true,
        greeting: "Hello from API",
    });
});
