import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
	transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: 587,
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS,
		},
	});

	async sendInvite(email: string, token: string) {
		const link = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;

		await this.transporter.sendMail({
			to: email,
			subject: 'Restaurant Staff Invite',
			html: `
        <h2>You have been invited</h2>
        <p>Click below to join:</p>
        <a href="${link}">${link}</a>
      `,
		});
	}

	async sendVerification(email: string, token: string) {
		const link = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

		await this.transporter.sendMail({
			to: email,
			subject: 'Verify your email',
			html: `<a href="${link}">Verify Email</a>`,
		});
	}
}
