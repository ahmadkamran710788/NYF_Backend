
import Contact, { IContact } from '../models/Contact';
import { Booking, BookingStatus, IBooking } from '../models/Booking';
import nodemailer from 'nodemailer';
import dotenv from "dotenv";

dotenv.config();
export const sendEmailNotification = async (contact: IContact): Promise<void> => {
  try {
    // Configure email transporter (example with Gmail)
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: `${process.env.NODEMAILER_EMAIL}`,
          pass: `${process.env.NODEMAILER_PASS}`
        },
        secure: true,  // Use TLS
        tls: {
          rejectUnauthorized: false  // Avoid issues with SSL/TLS certificate validation
        }
      });

    // Email content
    const mailOptions = {
      from: "ahmadkamran710788@gmail.com",
      to: "ahmadkamran710788@gmail.com" ,
      subject: 'NYF Contact Form Submission',
      html: `
        <h3>NYF Contact Form Submission </h3>
        <p><strong>Name:</strong> ${contact.firstName} ${contact.lastName}</p>
        <p><strong>Email:</strong> ${contact.email}</p>
        <p><strong>Phone:</strong> ${contact.phone}</p>
        <p><strong>Message:</strong> ${contact.message}</p>
        <p><strong>Submitted at:</strong> ${contact.createdAt}</p>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email notification failed:', error);
    // We don't throw the error here to prevent breaking the main flow
    // Instead, we just log it
  }
};

export const sendEmailOfBookNotification = async (completedBooking: any,stripeSession: any): Promise<void> => {
  try {
    // Configure email transporter (example with Gmail)
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: `${process.env.NODEMAILER_EMAIL}`,
          pass: `${process.env.NODEMAILER_PASS}`
        },
        secure: true,  // Use TLS
        tls: {
          rejectUnauthorized: false  // Avoid issues with SSL/TLS certificate validation
        }
      });

    // Email content
    // const mailOptions = {
    //   from: "ahmadkamran710788@gmail.com",
    //   to: "ahmadkamran710788@gmail.com" ,
    //   subject: 'NYF Contact Form Submission',
    //   html: `
    //     <h3>NYF Contact Form Submission </h3>
    //     <p><strong>Name:</strong> ${contact.firstName} ${contact.lastName}</p>
    //     <p><strong>Email:</strong> ${contact.email}</p>
    //     <p><strong>Phone:</strong> ${contact.phone}</p>
    //     <p><strong>Message:</strong> ${contact.message}</p>
    //     <p><strong>Submitted at:</strong> ${contact.createdAt}</p>
    //   `
    // };

    const mailOptions = {
  from: "ahmadkamran710788@gmail.com",
  to: `${completedBooking?.email}`,
  subject: 'NYF Booking Confirmation - Payment Successful',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #2c5aa0; text-align: center; margin-bottom: 30px;">🎉 Booking Confirmation</h2>
        
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p style="color: #2d5016; margin: 0; font-weight: bold; text-align: center;">
            ✅ Your payment was successful and booking has been confirmed!
          </p>
        </div>

        <h3 style="color: #333; border-bottom: 2px solid #2c5aa0; padding-bottom: 10px;">Booking Details</h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Booking Reference:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${completedBooking?.bookingReference}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Total Price:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333; font-weight: bold;">$${completedBooking?.totalPrice}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Status:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #28a745; font-weight: bold;">${completedBooking?.status}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Email:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${completedBooking?.email}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Phone Number:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${completedBooking?.phoneNumber}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; color: #555;">Payment Status:</td>
            <td style="padding: 10px; color: #28a745; font-weight: bold;">${stripeSession.payment_status}</td>
          </tr>
        </table>

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            <strong>What's Next?</strong><br>
            You will receive further details about your booking via email. If you have any questions, 
            please don't hesitate to contact us.
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            Thank you for choosing NYF!<br>
            This email was sent automatically, please do not reply.
          </p>
        </div>
      </div>
    </div>
  `
};

    // Send email
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email notification failed:', error);
    // We don't throw the error here to prevent breaking the main flow
    // Instead, we just log it
  }
};

