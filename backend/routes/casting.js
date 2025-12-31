const express = require('express');
const CastingTicket = require('../models/CastingTicket');
const Registration = require('../models/Registration');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all casting tickets (public - only approved)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    
    // If no status specified, only show approved tickets (for public)
    if (!status) {
      query.status = 'approved';
    } else if (status === 'all') {
      // Admin can see all tickets
      query = {};
    } else {
      query.status = status;
    }
    
    const tickets = await CastingTicket.find(query)
      .populate('createdBy', 'name email')
      .populate('registeredUsers', 'name email')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's registrations (user only) - MUST BE BEFORE /:id route
router.get('/user/registrations', auth, authorize('user'), async (req, res) => {
  try {
    const registrations = await Registration.find({ user: req.user.id })
      .populate('ticket', 'title description category location date status images')
      .sort({ createdAt: -1 });

    res.json(registrations.map(reg => ({
      _id: reg._id,
      ticket: reg.ticket,
      status: reg.status || 'pending',
      registeredAt: reg.createdAt
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single casting ticket
router.get('/:id', async (req, res) => {
  try {
    const ticket = await CastingTicket.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('registeredUsers', 'name email');
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get registered users for a ticket (casting/admin only - only ticket creator or admin)
router.get('/:id/registrations', auth, authorize('casting', 'admin'), async (req, res) => {
  try {
    const ticket = await CastingTicket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Only ticket creator or admin can view registrations
    if (ticket.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view registrations' });
    }

    // Get registrations with phone numbers, photos, videos, and user profile details
    const registrations = await Registration.find({ ticket: req.params.id })
      .populate('user', 'name lastName dob age address phoneNumber email role profilePhoto')
      .sort({ createdAt: -1 });

    res.json(registrations.map(reg => ({
      _id: reg._id,
      user: {
        _id: reg.user._id,
        name: reg.user.name,
        lastName: reg.user.lastName,
        dob: reg.user.dob,
        age: reg.user.age,
        address: reg.user.address,
        phoneNumber: reg.user.phoneNumber,
        email: reg.user.email,
        role: reg.user.role,
        profilePhoto: reg.user.profilePhoto || null
      },
      phoneNumber: reg.phoneNumber,
      photos: reg.photos || [],
      videos: reg.videos || [],
      status: reg.status || 'pending',
      registeredAt: reg.registeredAt || reg.createdAt
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create casting ticket (casting role only)
router.post('/', auth, authorize('casting', 'admin'), async (req, res) => {
  try {
    const { title, description, category, location, date, image, images } = req.body;

    if (!title || !description || !category || !location || !date) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    if (!['cinema', 'serial'].includes(category)) {
      return res.status(400).json({ message: 'Category must be either "cinema" or "serial"' });
    }

    const ticket = new CastingTicket({
      title,
      description,
      category,
      location,
      date,
      image: image || null,
      images: images || [],
      status: 'pending', // Always pending when created by casting director
      createdBy: req.user.id
    });

    await ticket.save();
    await ticket.populate('createdBy', 'name email');

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Register for casting ticket (user role only)
router.post('/:id/register', auth, authorize('user'), async (req, res) => {
  try {
    const { phoneNumber, photos, videos } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const ticket = await CastingTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.status !== 'approved') {
      return res.status(400).json({ message: 'This ticket is not approved yet' });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      ticket: req.params.id,
      user: req.user.id
    });

    if (existingRegistration || ticket.registeredUsers.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already registered' });
    }

    // Create registration with phone number, photos, and videos
    const registration = new Registration({
      ticket: req.params.id,
      user: req.user.id,
      phoneNumber,
      photos: photos || [],
      videos: videos || []
    });

    await registration.save();

    // Add user to ticket's registeredUsers array
    ticket.registeredUsers.push(req.user.id);
    await ticket.save();

    res.json({ message: 'Registered successfully', ticket });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Already registered' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Update casting ticket (casting/admin only)
router.put('/:id', auth, authorize('casting', 'admin'), async (req, res) => {
  try {
    const ticket = await CastingTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(ticket, req.body);
    await ticket.save();
    await ticket.populate('createdBy', 'name email');

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve ticket (admin only)
router.patch('/:id/approve', auth, authorize('admin'), async (req, res) => {
  try {
    const ticket = await CastingTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = 'approved';
    await ticket.save();
    await ticket.populate('createdBy', 'name email');

    res.json({ message: 'Ticket approved successfully', ticket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reject ticket (admin only)
router.patch('/:id/reject', auth, authorize('admin'), async (req, res) => {
  try {
    const ticket = await CastingTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = 'rejected';
    await ticket.save();
    await ticket.populate('createdBy', 'name email');

    res.json({ message: 'Ticket rejected successfully', ticket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete casting ticket (casting/admin only)
router.delete('/:id', auth, authorize('casting', 'admin'), async (req, res) => {
  try {
    const ticket = await CastingTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await ticket.deleteOne();
    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve registration (casting/admin only)
router.patch('/registrations/:registrationId/approve', auth, authorize('casting', 'admin'), async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.registrationId).populate('ticket');
    
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const ticket = registration.ticket;
    
    // Only ticket creator or admin can approve registrations
    if (ticket.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to approve this registration' });
    }

    registration.status = 'approved';
    await registration.save();

    res.json({ message: 'Registration approved successfully', registration });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reject registration (casting/admin only)
router.patch('/registrations/:registrationId/reject', auth, authorize('casting', 'admin'), async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.registrationId).populate('ticket');
    
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const ticket = registration.ticket;
    
    // Only ticket creator or admin can reject registrations
    if (ticket.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to reject this registration' });
    }

    registration.status = 'rejected';
    await registration.save();

    res.json({ message: 'Registration rejected successfully', registration });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

