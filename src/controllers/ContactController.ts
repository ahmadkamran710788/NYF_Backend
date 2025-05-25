// src/controllers/contactController.ts
import { Request, Response } from 'express';
import Contact, { IContact } from '../models/Contact';
import nodemailer from 'nodemailer';
import {sendEmailNotification} from '../utils/EmailHelper'

// Function to submit contact form
export const submitContactForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, phoneNumber, message } = req.body;

    // Create new contact record
    const contact: IContact = await Contact.create({
      firstName,
      lastName,
      email,
      phone:phoneNumber,
      message
    });

    // Optional: Send email notification
    await sendEmailNotification(contact);

    res.status(201).json({
      success: true,
      data: contact,
      message: 'Your message has been received. We will contact you shortly.'
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Server error occurred'
      });
    }
  }
};

// Function to send email notification
// const sendEmailNotification = async (contact: IContact): Promise<void> => {
//   try {
//     // Configure email transporter (example with Gmail)
//     const transporter = nodemailer.createTransport({
//         service: 'gmail',
//         auth: {
//           user: "ahmadkamran710788@gmail.com",
//           pass: "bglt jqfu yupr faha"
//         },
//         secure: true,  // Use TLS
//         tls: {
//           rejectUnauthorized: false  // Avoid issues with SSL/TLS certificate validation
//         }
//       });

//     // Email content
//     const mailOptions = {
//       from: "ahmadkamran710788@gmail.com",
//       to: "ahmadkamran710788@gmail.com" ,
//       subject: 'NYF Contact Form Submission',
//       html: `
//         <h3>NYF Contact Form Submission </h3>
//         <p><strong>Name:</strong> ${contact.firstName} ${contact.lastName}</p>
//         <p><strong>Email:</strong> ${contact.email}</p>
//         <p><strong>Phone:</strong> ${contact.phone}</p>
//         <p><strong>Message:</strong> ${contact.message}</p>
//         <p><strong>Submitted at:</strong> ${contact.createdAt}</p>
//       `
//     };

//     // Send email
//     await transporter.sendMail(mailOptions);
//   } catch (error) {
//     console.error('Email notification failed:', error);
//     // We don't throw the error here to prevent breaking the main flow
//     // Instead, we just log it
//   }
// };

// Function to get all contact submissions (for admin)
export const getContactSubmissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};