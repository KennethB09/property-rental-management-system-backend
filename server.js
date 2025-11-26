import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { router } from "./routes/routes.js";

dotenv.config();

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLIC_KEY
);

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(
  cors({
    origin: [
      process.env.CLIENT,
      "https://zmtvcrrs-5173.asse.devtunnels.ms",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Rental Platform API is running!" });
});

app.use("/rent-ease/api", router);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
