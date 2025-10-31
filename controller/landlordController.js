import { supabase } from "../server.js";
import { decode } from "base64-arraybuffer";

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
  }
}

export async function completeAccountSetup(req, res) {
  const { id, img, address, business_name, phone_number } = req.body;
  const base64 = img.split(",")[1];
  const mime = img.match(/:(.*?);/)[1];

  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("profile")
      .upload(id + "/" + "profile", decode(base64), {
        contentType: mime,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      throw uploadError
    }

    const { data, error } = await supabase
      .from("landlords")
      .update({
        profile_pic: uploadData.fullPath,
        address,
        business_name,
        phone_number,
        account_setup_complete: true,
      })
      .eq("id", id);

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
}
