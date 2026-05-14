import jwt from 'jsonwebtoken'

const authDoctor = (req, res, next) => {
    const { dtoken } = req.headers
    if (!dtoken) {
        return res.json({ success: false, message: 'Not Authorized Login Again' })
    }
    try {
        const decoded = jwt.verify(dtoken, process.env.JWT_SECRET)

        if (decoded.role !== 'doctor') {  // ✅ FIX: added role check
            return res.json({ success: false, message: 'Not Authorized' })
        }

        req.doctorId = decoded.id  // ✅ FIX: was req.body.docId, controllers read req.doctorId
        next()
    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}

export default authDoctor