import { supabase } from "../server.js";

export async function checkUserIfCompletedAccountSetup(req, res) {
  const userId = req.params.id;

  try {
    const { data, error } = await supabase
      .from("landlords")
      .select("account_setup_complete")
      .eq("id", userId);

    if (error) {
      throw error;
    }

    console.log(data);
    if (!data || data.length === 0) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(404).json(error);
    throw error;
  }
}
