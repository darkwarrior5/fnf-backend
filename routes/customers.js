const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// @route   POST /api/customers/sync
// @desc    Sync Firebase user to MongoDB (create or update)
// @access  Public
router.post('/sync', async (req, res) => {
  try {
    const { firebaseUid, firstName, lastName, phone, email } = req.body;
    
    if (!firebaseUid || !firstName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Firebase UID, first name, and phone are required'
      });
    }
    
    // Find existing customer by Firebase UID or create new
    let customer = await Customer.findOne({ firebaseUid });
    
    if (customer) {
      // Update existing customer
      customer.firstName = firstName;
      customer.lastName = lastName || '';
      customer.phone = phone;
      customer.email = email || '';
      customer.lastLogin = new Date();
      await customer.save();
      
      console.log('✅ Customer updated:', customer._id);
    } else {
      // Create new customer
      customer = await Customer.create({
        firebaseUid,
        firstName,
        lastName: lastName || '',
        phone,
        email: email || '',
        lastLogin: new Date()
      });
      
      console.log('✅ Customer created:', customer._id);
    }
    
    res.json({
      success: true,
      message: 'Customer synced successfully',
      customer: {
        _id: customer._id,
        firebaseUid: customer.firebaseUid,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        email: customer.email
      }
    });
    
  } catch (error) {
    console.error('Customer sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing customer'
    });
  }
});

// @route   GET /api/customers
// @desc    Get all customers
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;

    const customers = await Customer.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Customer.countDocuments();

    res.json({ 
      success: true, 
      customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching customers' 
    });
  }
});

// @route   GET /api/customers/:id
// @desc    Get single customer
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    res.json({ 
      success: true, 
      customer 
    });

  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching customer' 
    });
  }
});

// @route   PUT /api/customers/:id
// @desc    Update customer
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, address } = req.body;

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, email, address },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({ 
      success: true,
      message: 'Customer updated successfully',
      customer
    });

  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating customer'
    });
  }
});

// @route   DELETE /api/customers/:id
// @desc    Delete customer
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({ 
      success: true,
      message: 'Customer deleted successfully',
      customer
    });

  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting customer'
    });
  }
});

module.exports = router;