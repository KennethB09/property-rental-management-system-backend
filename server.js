// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use service key for backend operations
);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Rental Platform API is running!' });
});

// Get all properties
app.get('/api/properties', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        landlord:profiles(name, email),
        property_images(image_url)
      `);

    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get property by ID
app.get('/api/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        landlord:profiles(name, email, phone),
        property_images(image_url),
        reviews(rating, comment, created_at, tenant:profiles(name))
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(404).json({ success: false, error: 'Property not found' });
  }
});

// Search properties with filters
app.get('/api/properties/search', async (req, res) => {
  try {
    const { 
      city, 
      min_price, 
      max_price, 
      property_type, 
      bedrooms,
      available_from 
    } = req.query;

    let query = supabase
      .from('properties')
      .select(`
        *,
        landlord:profiles(name),
        property_images(image_url)
      `);

    // Apply filters
    if (city) query = query.ilike('city', `%${city}%`);
    if (min_price) query = query.gte('price_per_night', min_price);
    if (max_price) query = query.lte('price_per_night', max_price);
    if (property_type) query = query.eq('property_type', property_type);
    if (bedrooms) query = query.eq('bedrooms', bedrooms);
    if (available_from) query = query.gte('available_from', available_from);

    const { data, error } = await query;

    if (error) throw error;
    
    res.json({ success: true, data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new property (landlord only)
app.post('/api/properties', async (req, res) => {
  try {
    const {
      title,
      description,
      price_per_night,
      property_type,
      bedrooms,
      bathrooms,
      city,
      address,
      amenities,
      landlord_id
    } = req.body;

    const { data, error } = await supabase
      .from('properties')
      .insert({
        title,
        description,
        price_per_night,
        property_type,
        bedrooms,
        bathrooms,
        city,
        address,
        amenities,
        landlord_id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create booking
app.post('/api/bookings', async (req, res) => {
  try {
    const {
      property_id,
      tenant_id,
      check_in_date,
      check_out_date,
      total_price,
      guest_count
    } = req.body;

    // Check if property is available for those dates
    const { data: existingBookings, error: checkError } = await supabase
      .from('bookings')
      .select('*')
      .eq('property_id', property_id)
      .eq('status', 'confirmed')
      .or(`check_in_date.lte.${check_out_date},check_out_date.gte.${check_in_date}`);

    if (checkError) throw checkError;
    
    if (existingBookings.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Property is not available for selected dates' 
      });
    }

    // Create booking
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        property_id,
        tenant_id,
        check_in_date,
        check_out_date,
        total_price,
        guest_count,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user bookings
app.get('/api/bookings/user/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        property:properties(title, city, property_images(image_url))
      `)
      .eq('tenant_id', user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add review
app.post('/api/reviews', async (req, res) => {
  try {
    const {
      property_id,
      tenant_id,
      rating,
      comment
    } = req.body;

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        property_id,
        tenant_id,
        rating,
        comment,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});