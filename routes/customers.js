const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

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