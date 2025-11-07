import { supabase } from "../server.js";

export async function getPropertyType(req, res) {
  try {
    const { data, error } = await supabase.from("property_type").select("*");

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
}
