const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Customer = require('../models/Customer');

// @route   POST /api/orders
// @desc    Create new order
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { customerId, items, totalAmount, deliveryAddress, paymentMethod, notes } = req.body;

    // Validate required fields
    if (!customerId || !items || items.length === 0 || !totalAmount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer ID, items, and total amount are required' 
      });
    }

    // Verify customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    // Generate unique order number
    const generateOrderNumber = () => {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `FNF${timestamp}${random}`;
    };
    const orderNumber = generateOrderNumber();

    // Create order
    const order = await Order.create({
      orderNumber,
      customer: customerId,
      items,
      totalAmount,
      deliveryAddress: deliveryAddress || customer.address,
      paymentMethod: paymentMethod || 'cash',
      notes
    });

    // Update customer stats
    customer.totalOrders += 1;
    customer.totalSpent += totalAmount;
    customer.lastOrderDate = new Date();
    await customer.save();

    // Populate customer details
    await order.populate('customer', 'firstName lastName phone email');

    res.status(201).json({ 
      success: true, 
      message: 'Order created successfully',
      order 
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating order' 
    });
  }
});

// @route   GET /api/orders
// @desc    Get all orders (with filters)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { status, customerId, limit = 50, page = 1 } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (customerId) filter.customer = customerId;

    // Get orders with pagination
    const orders = await Order.find(filter)
      .populate('customer', 'firstName lastName phone email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({ 
      success: true, 
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching orders' 
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'firstName lastName phone email address');

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    res.json({ 
      success: true, 
      order 
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching order' 
    });
  }
});

// @route   PUT /api/orders/:id
// @desc    Update order status
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const { status, cancellationReason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Update status
    if (status) {
      order.status = status;

      if (status === 'delivered') {
        order.deliveredAt = new Date();
        order.paymentStatus = 'paid';
      } else if (status === 'cancelled') {
        order.cancelledAt = new Date();
        order.cancellationReason = cancellationReason;
      }
    }

    await order.save();
    await order.populate('customer', 'firstName lastName phone email');

    res.json({ 
      success: true, 
      message: 'Order updated successfully',
      order 
    });

  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating order' 
    });
  }
});

// @route   DELETE /api/orders/:id
// @desc    Delete order
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Order deleted successfully' 
    });

  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting order' 
    });
  }
});

// @route   GET /api/orders/stats/summary
// @desc    Get order statistics
// @access  Public
router.get('/stats/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const [
      totalOrders,
      totalRevenue,
      statusBreakdownArray,
      topProductsArray
    ] = await Promise.all([
      Order.countDocuments(filter),
      Order.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: filter },
        { $unwind: '$items' },
        { $group: {
            _id: '$items.productName',
            totalQuantity: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.totalPrice' }
        }},
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 }
      ])
    ]);

    // Convert statusBreakdown array to object
    const statusBreakdown = {};
    statusBreakdownArray.forEach(item => {
      statusBreakdown[item._id] = item.count;
    });

    // Convert topProducts array to proper format
    const topProducts = topProductsArray.map(item => ({
      name: item._id,
      quantity: item.totalQuantity,
      revenue: item.totalRevenue
    }));

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        statusBreakdown,
        topProducts
      }
    });  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching statistics' 
    });
  }
});

module.exports = router;
