import { supabase } from "../server.js";
import { decode } from "base64-arraybuffer";

function getBase64AndMimeType(image) {
  const base64 = image.split(",")[1];
  const mime = image.match(/:(.*?);/)[1];

  return { mime, base64 };
}

export async function uploadProfile(id, image, path) {
  const base64 = image.split(",")[1];
  const mime = image.match(/:(.*?);/)[1];

  if (path === "" || path === undefined || path === null) {
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

  const { data, error } = await supabase.storage
    .from("profile")
    .update(path, decode(base64), {
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
  const imagesPath = [];

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

  thumbnailPath = data.path;

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

    imagesPath.push(data.path);
  }

  return {
    status: true,
    data: { thumbnail: thumbnailPath, images: imagesPath },
  };
}

async function updatePropertyImages(id, thumbnail, images) {
  const parseImages = JSON.parse(images);
  const propertyImages = parseImages.currentImages;
  let thumbnailPath;

  if (thumbnail.type === "route") {
    thumbnailPath = thumbnail.thumbnail;
  } else {
    const image64 = getBase64AndMimeType(thumbnail.thumbnail.data_url);

    const { data, error } = await supabase.storage
      .from("listings_image")
      .update(
        id + "/property-images/thumbnail/thumbnail",
        decode(image64.base64),
        {
          contentType: image64.mime,
          cacheControl: "3600",
          upsert: true,
        }
      );

    if (error) {
      return { status: false, error: error };
    }

    thumbnailPath = data.path;
  }

  if (parseImages.newImages.length !== 0) {
    for (let i = 0; i < parseImages.newImages.length; i++) {
      const image64 = getBase64AndMimeType(parseImages.newImages[i].data_url);

      const { data, error } = await supabase.storage
        .from("listings_image")
        .upload(
          id + "/property-images/images/" + `image${new Date()}${i}`,
          decode(image64.base64),
          {
            contentType: image64.mime,
            upsert: true,
          }
        );

      if (error) {
        return { status: false, error: error };
      }

      propertyImages.push(data.path);
    }
  }

  if (parseImages.deleteImages.length !== 0) {
    const { error } = await supabase.storage
      .from("listings_image")
      .remove(parseImages.deleteImages);

    if (error) {
      return { status: false, error: error };
    }
  }

  return {
    status: true,
    data: { thumbnail: thumbnailPath, images: propertyImages },
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

    const { error: updateUserError } = await supabase.auth.admin.updateUserById(
      id,
      { user_metadata: { profileImage: uploadImage.data.fullPath } }
    );

    if (updateUserError) {
      throw updateUserError;
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
    path,
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

    const uploadImage = await uploadProfile(id, img, path);

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

    const { data: lisiting, error: updateError } = await supabase
      .from("listings")
      .update({
        thumbnail: propertyImages.data.thumbnail,
        images: propertyImages.data.images,
      })
      .eq("id", data.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res
      .status(200)
      .json({ property: lisiting, message: "Property added successfully." });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
}

export async function getLandlordProperties(req, res) {
  const userId = req.params.id;

  try {
    const { data, error } = await supabase
      .from("listings")
      .select("*, property_type(id, name)")
      .eq("landlord_ID", userId)
      .limit(20);

    if (error) {
      throw error;
    }

    res.status(200).json({ data: data });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
}

export async function EditLandlordProperty(req, res) {
  const propertyId = req.params.id;
  const {
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
    const updateImages = await updatePropertyImages(
      propertyId,
      thumbnail,
      images
    );

    if (updateImages.error) {
      throw updateImages.error;
    }

    const { data, error } = await supabase
      .from("listings")
      .update({
        name: title,
        description: description,
        address: address,
        rent: rent,
        status: status,
        latitude: lat,
        longitude: lng,
        occupant: occupant,
        property_type: propertyType,
        thumbnail: updateImages.data.thumbnail,
        images: updateImages.data.images,
      })
      .eq("id", propertyId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res
      .status(200)
      .json({ property: data, message: "Property updated successfully." });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
}

export async function deleteProperty(req, res) {
  const propertyId = req.params.id;

  try {
    const {
      data,
      status,
      error: getError,
    } = await supabase
      .from("listings")
      .select("status")
      .eq("id", propertyId)
      .single();

    if (getError) {
      throw getError;
    }

    if (data.status !== "unlisted") {
      return res.status(405).json({
        message: "You can only delete a property with status unlisted.",
      });
    }

    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", propertyId);

    if (error) {
      throw error;
    }

    // List all files in the property-images folder
    const { data: files, error: listError } = await supabase.storage
      .from("listings_image")
      .list(`${propertyId}/property-images/images`, {
        limit: 100,
        offset: 0,
      });

    if (listError) {
      throw listError;
    }

    // If there are files, delete them all
    if (files && files.length > 0) {
      const filePaths = files.map(
        (file) => `${propertyId}/property-images/images/${file.name}`
      );

      // Add the thumbnail path to the array
      filePaths.push(`${propertyId}/property-images/thumbnail/thumbnail`);

      // Now remove all files
      const { error: deleteError } = await supabase.storage
        .from("listings_image")
        .remove(filePaths);

      if (deleteError) {
        throw deleteError;
      }
    }

    res.status(status).json({ message: "Delete success." });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
}

export async function countLandlordPropertiesAndGetStatus(req, res) {
  const userId = req.params.id;

  try {
    const { count: totalCount, error } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("landlord_ID", userId);

    if (error) {
      throw error;
    }

    const unlistedProperties = await countProperties(userId, "unlisted");

    if (!unlistedProperties.status) return unlistedProperties.error;

    const availableProperties = await countProperties(userId, "available");

    if (!availableProperties.status) return availableProperties.error;

    const occupiedProperties = await countProperties(userId, "occupied");

    if (!occupiedProperties.status) return occupiedProperties.error;

    res.status(200).json({
      unlisted: unlistedProperties.count,
      available: availableProperties.count,
      occupied: occupiedProperties.count,
      total: totalCount,
    });
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ message: error.message });
  }
}

async function countProperties(id, status) {
  const { count, error } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("landlord_ID", id)
    .eq("status", status);

  if (error) {
    return { status: false, error: error };
  }

  return { status: true, count: count };
}

export async function getLandlordConversation(req, res) {
  const userId = req.params.id;

  try {
    const { data, status, error } = await supabase
    .from("conversations")
    .select("*, listing_id(*), tenant_id(*), landlord_id(*)")
    .eq("landlord_id", userId);

    if (error) {
      throw error
    }

    res.status(status).json(data);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
}