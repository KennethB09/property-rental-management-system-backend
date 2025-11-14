import { supabase } from "../server.js";
import { uploadProfile } from "./landlordController.js";

export async function getTenantProfile(req, res) {
  const userId = req.params.id;

  try {
    const { data, status, error } = await supabase
      .from("tenants")
      .select("*, occupation(id, name)")
      .eq("id", userId)
      .single();

    if (error) {
      throw error;
    }

    res.status(status).json(data);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
}

export async function getTenantSaveListing(req, res) {
  const userId = req.params.id;

  try {
    const { data, status, error } = await supabase
      .from("saves")
      .select(
        "*, listing_ID(*, landlord_ID(id, first_name, last_name, profile_pic), property_type(id, name))"
      )
      .eq("tenant_ID", userId);

    if (error) {
      throw error;
    }

    res.status(status).json(data);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
}

export async function tenantSaveListing(req, res) {
  const { listing_ID, user_ID } = req.body;

  try {
    const { data, status, error } = await supabase
      .from("saves")
      .insert({
        listing_ID: listing_ID,
        tenant_ID: user_ID,
      })
      .select(
        "*, listing_ID(*, landlord_ID(id, first_name, last_name, profile_pic), property_type(id, name))"
      )
      .single();

    if (error) {
      throw error;
    }

    res.status(status).json(data);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
}

export async function tenantRemoveListing(req, res) {
  const listingId = req.params.id;

  try {
    const { error } = await supabase
      .from("saves")
      .delete()
      .eq("listing_ID", listingId);

    if (error) {
      throw error;
    }

    res.status(200).json({ message: "Delete success." });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
}

export async function EditTenantProfile(req, res) {
  const {
    path,
    img,
    id,
    first_name,
    last_name,
    phone_number,
    occupation
  } = req.body;

  try {
    if (img === "") {
      const { error } = await supabase
        .from("tenants")
        .update({
          first_name: first_name,
          last_name: last_name,
          phone_number: phone_number,
          occupation: occupation
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
      .from("tenants")
      .update({
        first_name: first_name,
        last_name: last_name,
        phone_number: phone_number,
        occupation: occupation,
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