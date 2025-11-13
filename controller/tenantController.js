import { supabase } from "../server.js";

export async function getTenantSaveListing(req, res) {
  const userId = req.params.id;

  try {
    const { data, status, error } = await supabase
      .from("saves")
      .select("*")
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
      .select("*")
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
      .eq("listing_ID", listingId)

    if (error) {
      throw error;
    }

    res.status(200).json({ message: "Delete success."});
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
}