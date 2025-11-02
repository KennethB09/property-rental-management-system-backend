import { supabase } from "../server.js";
import { decode } from "base64-arraybuffer";

async function uploadProfile(id, image) {
  const base64 = image.split(",")[1];
  const mime = image.match(/:(.*?);/)[1];

  const { data, error } = await supabase.storage
      .from("profile")
      .upload(id + "/" + "profile", decode(base64), {
        contentType: mime,
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      return { status: false, error: error };
    }

    return { status: true, data: data }
}

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

  try {
    const uploadImage = await uploadProfile(id, img);

    if (!uploadImage.status) {
      throw uploadImage.error
    }

    const { data, error } = await supabase
      .from("landlords")
      .update({
        profile_pic: uploadImage.data.fullPath,
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

async function getProfileImage(userId) {
  const { data, error } = await supabase.storage
    .from("profile")
    .list(userId + "/", {
      limit: 1,
    });

  if (error) {
    return { success: false, error: error };
  }

  return { success: true, data: data };
}

export async function getProfile(req, res) {
  const userId = req.params.id;

  try {
    const { data, error } = await supabase
      .from("landlords")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      throw error;
    }

    // Get user profile
    const profileImage = await getProfileImage(userId);

    if (!profileImage.success) {
      throw profileImage.error;
    }

    res.status(200).json({ userData: data, userProfile: profileImage.data });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
}

export async function EditLandlordProfile(req, res) {
  const {
    img,
    id,
    first_name,
    last_name,
    phone_number,
    address,
    business_name,
  } = req.body;

  try {
    if (img === "") {
      const { error } = await supabase
        .from("landlords")
        .update({
          first_name: first_name,
          last_name: last_name,
          phone_number: phone_number,
          address: address,
          business_name: business_name
        })
        .eq("id", id);

      if (error) {
        throw error;
      }

      return res.status(200).json({ message: "Profile updated." });
    }

    const uploadImage = await uploadProfile(id, img);

    if (!uploadImage.status) {
      throw uploadImage.error
    }

    const { error } = await supabase
      .from("landlords")
      .update({
        first_name: first_name,
        last_name: last_name,
        phone_number: phone_number,
        address: address,
        business_name: business_name,
        profile_pic: uploadImage.data.fullPath
      })
      .eq("id", id);

    if (error) {
      throw error;
    }

    res.status(200).json({ message: "Profile updated." });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
}
