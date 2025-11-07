import { supabase } from "../server.js";
import { decode } from "base64-arraybuffer";

function getBase64AndMimeType(image) {
  const base64 = image.split(",")[1];
  const mime = image.match(/:(.*?);/)[1];

  return { mime, base64 };
}

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

  return { status: true, data: data };
}

async function uploadPropertyImages(id, thumbnail, images) {
  let thumbnailPath;
  let imagesPath;

  const PARCE_IMAGES = JSON.parse(images);

  const thumbnailBase64 = getBase64AndMimeType(thumbnail);

  const { data, error } = await supabase.storage
    .from("listings_image")
    .upload(
      id + "/property-images/thumbnail/" + "thumbnail",
      decode(thumbnailBase64.base64),
      {
        contentType: thumbnailBase64.mime,
        cacheControl: "3600",
        upsert: true,
      }
    );

  if (error) {
    return { status: false, error: error };
  }

  thumbnailPath = data.fullPath;

  for (let i = 0; i < PARCE_IMAGES.length; i++) {
    const imageBase64 = getBase64AndMimeType(PARCE_IMAGES[i].data_url);

    const { data, error } = await supabase.storage
      .from("listings_image")
      .upload(
        id + "/property-images/images/" + `image${i}`,
        decode(imageBase64.base64),
        {
          contentType: imageBase64.mime,
          cacheControl: "3600",
          upsert: true,
        }
      );

    if (error) {
      return { status: false, error: error };
    }

    if (i === PARCE_IMAGES.length - 1) {
      imagesPath = data.path;
    }
  }

  return {
    status: true,
    data: { thumbnail: thumbnailPath, images: imagesPath },
  };
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
      throw uploadImage.error;
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
          business_name: business_name,
        })
        .eq("id", id);

      if (error) {
        throw error;
      }

      return res.status(200).json({ message: "Profile updated." });
    }

    const uploadImage = await uploadProfile(id, img);

    if (!uploadImage.status) {
      throw uploadImage.error;
    }

    const { error } = await supabase
      .from("landlords")
      .update({
        first_name: first_name,
        last_name: last_name,
        phone_number: phone_number,
        address: address,
        business_name: business_name,
        profile_pic: uploadImage.data.fullPath,
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

export async function listProperty(req, res) {
  const {
    id,
    title,
    description,
    address,
    rent,
    status,
    occupant,
    images,
    thumbnail,
    propertyType,
    lng,
    lat,
  } = req.body;

  try {
    const { data, error } = await supabase
      .from("listings")
      .insert({
        name: title,
        description: description,
        address: address,
        rent: rent,
        status: status,
        latitude: lat,
        longitude: lng,
        landlord_ID: id,
        occupant: occupant,
        property_type: propertyType,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    const propertyImages = await uploadPropertyImages(
      data.id,
      thumbnail.data_url,
      images
    );

    if (!propertyImages.status) {
      throw propertyImages.error;
    }

    const { error: updateError } = await supabase
      .from("listings")
      .update({
        thumbnail: propertyImages.data.thumbnail,
        images: propertyImages.data.images,
      })
      .eq("id", data.id)

    if (updateError) {
      throw updateError;
    }

    res
      .status(200)
      .json({ property: data, message: "Property added successfully." });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
}
