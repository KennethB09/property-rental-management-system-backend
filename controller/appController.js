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

export async function getListedProperties(req, res) {
  try {
    const { data, status, error } = await supabase
    .from("listings")
    .select("*, landlord_ID(id, first_name, last_name, profile_pic), property_type(id, name)")
    .eq("status", "available")
    .limit(50);

    if (error) {
      throw error
    }

    res.status(status).json(data);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
}

export async function getOccupationType(req, res) {
  try {
    const { data, status, error } = await supabase
    .from("occupation_type")
    .select("*");

    if (error) {
      throw error
    }

    res.status(status).json(data);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
}

export async function createConvesation(req, res) {
  const { listing_Id, tenant_Id, landlord_Id } = req.body;

  try {
    const { data, status, error } = await supabase
    .from("conversations")
    .insert({
      listing_id: listing_Id,
      tenant_id: tenant_Id,
      landlord_id: landlord_Id
    })
    .select("*")
    .single();

    if (error) {
      throw error
    }

    res.status(status).json(data);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
}