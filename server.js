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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Rental Platform API is running!" });
});

app.use('/rent-ease/api', router);

// Middleware to check user role
// const checkRole = (allowedRoles) => {
//   return async (req, res, next) => {
//     const {
//       data: { user },
//     } = await supabase.auth.getUser(req.headers.authorization);

//     if (!user) {
//       return res.status(401).json({ error: "Unauthorized" });
//     }

//     const userRole = await supabase.rpc(
//       "get_user_role",
//       {},
//       {
//         headers: { Authorization: req.headers.authorization },
//       }
//     );

//     if (!allowedRoles.includes(userRole)) {
//       return res.status(403).json({ error: "Forbidden" });
//     }

//     req.user = user;
//     next();
//   };
// };

// // Protected routes
// app.get('/landlord/dashboard',
//   checkRole(['landlord']),
//   async (req, res) => {
//     // Landlord-specific logic
//   }
// )

// app.get('/tenant/dashboard',
//   checkRole(['tenant']),
//   async (req, res) => {
//     // Tenant-specific logic
//   }
// )

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
