import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { EmailService } from './email.service';

describe('EmailService', () => {
	let service: EmailService;
	let mockSendMail: any;

	beforeEach(() => {
		process.env.FRONTEND_URL = 'https://app.example.com';

		service = new EmailService();
		mockSendMail = mock(() => Promise.resolve({ messageId: 'msg-1' }));
		service.transporter = { sendMail: mockSendMail } as any;
	});

	describe('sendInvite', () => {
		it('should send an invite email with the correct link', async () => {
			await service.sendInvite('staff@test.com', 'invite-token-123');

			expect(mockSendMail).toHaveBeenCalledTimes(1);

			const call = mockSendMail.mock.calls[0][0];
			expect(call.to).toBe('staff@test.com');
			expect(call.subject).toBe('Restaurant Staff Invite');
			expect(call.html).toContain('https://app.example.com/accept-invite?token=invite-token-123');
		});
	});

	describe('sendVerification', () => {
		it('should send a verification email with the correct link', async () => {
			await service.sendVerification('user@test.com', 'verify-token-456');

			expect(mockSendMail).toHaveBeenCalledTimes(1);

			const call = mockSendMail.mock.calls[0][0];
			expect(call.to).toBe('user@test.com');
			expect(call.subject).toBe('Verify your email');
			expect(call.html).toContain('https://app.example.com/verify-email?token=verify-token-456');
		});
	});
});
