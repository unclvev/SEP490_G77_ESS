using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Configuration;
using System;
using System.Threading.Tasks;

namespace SEP490_G77_ESS.Services
{
    public class EmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public virtual async Task SendVerificationEmailAsync(string toEmail, string verificationLink)
        {
            var emailSettings = _configuration.GetSection("EmailSettings");

            var email = new MimeMessage();
            email.From.Add(new MailboxAddress(emailSettings["SenderName"], emailSettings["SenderEmail"]));
            email.To.Add(new MailboxAddress("", toEmail));
            email.Subject = "Xác nhận tài khoản của bạn";

            email.Body = new TextPart("html")
            {
                Text = $"<p>Nhấn vào liên kết bên dưới để xác thực tài khoản của bạn:</p><br>" +
                       $"<a href='{verificationLink}' target='_blank'>Xác nhận tài khoản</a>" +
                       $"<p>Liên kết này sẽ hết hạn sau 1 giờ.</p>"
            };

            using var smtp = new SmtpClient();
            await smtp.ConnectAsync(emailSettings["SmtpServer"], int.Parse(emailSettings["Port"]), SecureSocketOptions.StartTls);
            await smtp.AuthenticateAsync(emailSettings["SenderEmail"], emailSettings["Password"]);
            await smtp.SendAsync(email);
            await smtp.DisconnectAsync(true);
        }
    }
}
