using AuthenticationService.DTO;
using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using APIGateWay.config;

namespace AuthenticationService.Utils
{
    public class Email
    {
        private readonly EmailSettings _emailSettings;

        public Email(IOptions<EmailSettings> emailSettings)
        {
            _emailSettings = emailSettings.Value;
        }

        public static bool IsValid(string email)
        {
            try
            {
                var addr = new MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }

        // Send OTP via email
        public async Task SendEmailAsync(Mailrequest mailrequest)
        {
            if (_emailSettings.Port <= 0 || _emailSettings.Port > 65535)
            {
                throw new ArgumentOutOfRangeException(nameof(_emailSettings.Port), "Port number must be between 1 and 65535.");
            }

            var smtpClient = new SmtpClient(_emailSettings.Host)
            {
                Port = _emailSettings.Port,
                Credentials = new NetworkCredential(_emailSettings.Email, _emailSettings.Password),
                EnableSsl = true,
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(_emailSettings.Email, _emailSettings.DisplayName),
                Subject = mailrequest.Subject,
                Body = mailrequest.Emailbody,
                IsBodyHtml = true,
            };
            mailMessage.To.Add(mailrequest.Email);

            await smtpClient.SendMailAsync(mailMessage);
        }
    }
}
