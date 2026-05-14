import express from "express"
import cors from 'cors'
import 'dotenv/config'
import db from "./config/mysql.js"
import userRouter from "./routes/userRoute.js"
import doctorRouter from "./routes/doctorRoute.js"
import adminRouter from "./routes/adminRoute.js"

const app = express()
const port = process.env.PORT || 4000

app.use(express.json())
app.use(cors())

app.use("/api/user", userRouter)
app.use("/api/admin", adminRouter)
app.use("/api/doctor", doctorRouter)

app.get("/", (req, res) => res.send("API Working"))

// ✅ FIX: sirf tab listen karo jab directly run ho (testing mein nahi)
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`Server started on PORT:${port}`))
}

// ✅ app export karo taaki supertest use kar sake
export default app