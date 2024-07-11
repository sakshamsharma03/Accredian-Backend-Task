import express from 'express';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { body, validationResult } from 'express-validator';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const referralValidationRules = [
  body('referrer').notEmpty().withMessage('Referrer name is required'),
  body('referee').notEmpty().withMessage('Referee name is required'),
  body('email').isEmail().withMessage('Invalid email address'),
];

app.post('/referrals', referralValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { referrer, referee, email } = req.body;

  try {
    const newReferral = await prisma.referral.create({
      data: {
        referrer,
        referee,
        email,
      },
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host:"smtp.gmail.com",
      port:465,
      secure:true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: `${email}`,
      subject: 'Referral Invitation',
      text: `Hi ${referee},\n\n${referrer} has referred you. Join us now!`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        console.log(mailOptions);
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ error: 'Failed to send email' });
      }

      res.status(201).json({ message: 'Referral created and email sent', referral: newReferral });
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create referral' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
