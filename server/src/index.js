import dotenv from "dotenv";
import express from "express";
import cors from "cors";

import connectDB from "./config/db";

dotenv.config();

export const app = express();

app.use(express.json());
app.use(cors());

// connect to the database
connectDB();

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
