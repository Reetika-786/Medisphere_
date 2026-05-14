import jwt from "jsonwebtoken"

const authAdmin = (req, res, next) => {
    const { atoken } = req.headers
    if (!atoken) {
        return res.json({ success: false, message: "Not Authorized Login Again" })
    }
    try {
        const decoded = jwt.verify(atoken, process.env.JWT_SECRET)
        if (decoded.role !== "admin") {
            return res.json({ success: false, message: "Not Authorized" })
        }
        next()
    } catch (error) {
        return res.json({ success: false, message: "Invalid Token" })
    }
}

export default authAdmin