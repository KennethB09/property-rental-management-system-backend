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
      .select(
        "*, landlord_ID(id, first_name, last_name, profile_pic), property_type(id, name)"
      )
      .eq("status", "available")
      .limit(50);

    if (error) {
      throw error;
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
      throw error;
    }

    res.status(status).json(data);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
}

export async function createConvesation(req, res) {
  const { listing_Id, tenant_Id, landlord_Id, message } = req.body;

  try {
    const { data, status, error } = await supabase
      .from("conversations")
      .insert({
        listing_id: listing_Id,
        tenant_id: tenant_Id,
        landlord_id: landlord_Id,
      })
      .select("*, last_msg(content, created_at)")
      .single();

    if (error) {
      throw error;
    }

    const { error:msgError } = await supabase
    .from("messages")
    .insert({
      convo_id: data.id,
      sender_id: tenant_Id,
      content: message,
      replying_to: null
    });

    if (msgError) {
      throw msgError
    }

    res.status(status).json(data);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
}

export async function sendMessage(req, res) {
  const conversationId = req.params.id;
  const { senderId, message, replyingTo } = req.body;

  try {
    const { data, status, error } = await supabase
      .from("messages")
      .insert({
        convo_id: conversationId,
        sender_id: senderId,
        content: message,
        replying_to: replyingTo,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error sending message:", error);
      throw error
    }

    const { error:updateError } = await supabase
    .from("conversations")
    .update({ last_msg: data.id }).eq("id", conversationId);

    if (updateError) {
      throw updateError
    }

    res.status(status).json(data);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
}

export async function getMessages(req, res) {
  const conversationId = req.params.id;

  try {
    const { data, status, error } = await supabase
      .from("messages")
      .select("*")
      .eq("convo_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    res.status(status).json(data);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
}
