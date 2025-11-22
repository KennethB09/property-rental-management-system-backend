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
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    const { error: msgError } = await supabase.from("messages").insert({
      convo_id: data.id,
      sender_id: tenant_Id,
      content: message,
      replying_to: null,
    });

    if (msgError) {
      throw msgError;
    }

    const { data: getData, error: getError } = await supabase
      .from("conversations")
      .select("*, last_msg(content, created_at)")
      .single();

    if (getError) {
      throw getError;
    }

    res.status(status).json(getData);
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
      throw error;
    }

    const { error: updateError } = await supabase
      .from("conversations")
      .update({ last_msg: data.id })
      .eq("id", conversationId);

    if (updateError) {
      throw updateError;
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

export async function createTenancy(req, res) {
  const { landlord_id, tenant_id, property_id, status, initiated_by } =
    req.body;

  try {
    const { data, error } = await supabase
      .from("tenancies")
      .insert({
        landlord_id,
        tenant_id,
        property_id,
        status,
        initiated_by,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
}

export async function getUserTenancies(req, res) {
  const userId = req.params.id;
  try {
    const { data, error } = await supabase
      .from("tenancies")
      .select(
        "*, property_id(id, name, thumbnail, rent), tenant_id(id, first_name, last_name, profile_pic), landlord_id(id, first_name, last_name)"
      )
      .or(`landlord_id.eq.${userId},tenant_id.eq.${userId}`);

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
}

export async function updateTenancyStatus(req, res) {
  const listing_Id = req.params.id;
  const { id, status } = req.body;

  try {
    if (status === "active") {
      const { error } = await supabase
        .from("listings")
        .update({
          status: "occupied",
        })
        .eq("id", listing_Id);

      if (error) {
        throw error;
      }
    }

    if (status === "ended") {
      const { error } = await supabase
        .from("listings")
        .update({
          status: "unlisted",
        })
        .eq("id", listing_Id);

      if (error) {
        throw error;
      }
    }

    const { data, error } = await supabase
      .from("tenancies")
      .update({
        status: status,
      })
      .eq("id", id)
      .select("status")
      .single();

    if (error) {
      throw error;
    }

    if (status === "active") {
      const { data, error } = await supabase
        .from("tenancies")
        .update({
          start: new Date(),
        })
        .eq("id", id)
        .select("status")
        .single();

      if (error) {
        throw error;
      }

      return res.status(200).json(data);
    }

    if (status === "ended") {
      const { data, error } = await supabase
        .from("tenancies")
        .update({
          end: new Date(),
        })
        .eq("id", id)
        .select("status")
        .single();

      if (error) {
        throw error;
      }

      return res.status(200).json(data);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
}

export async function postReview(req, res) {
  const property_id = req.params.id;
  const { tenant, content, rating } = req.body;

  try {
    const { data, error, status } = await supabase
      .from("reviews")
      .insert({
        listing_ID: property_id,
        tenant_ID: tenant,
        content: content,
        rating: rating,
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

export async function getPropertyRating(req, res) {
  const propertyId = req.params.id;

  try {
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("*, tenant_ID(first_name, last_name, profile_pic)")
      .eq("listing_ID", propertyId);

    if (error) {
      throw error;
    }

    const reviewCount = reviews.length;
    const overallRating =
      reviewCount > 0
        ? (
            reviews.reduce((sum, review) => sum + review.rating, 0) /
            reviewCount
          ).toFixed(2)
        : 0;

    res.status(200).json({
      reviews,
      reviewLength: reviewCount,
      rating: parseFloat(overallRating),
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
}
