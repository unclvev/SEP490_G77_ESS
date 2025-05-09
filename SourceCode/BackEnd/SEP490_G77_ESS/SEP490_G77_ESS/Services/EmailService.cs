﻿using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Configuration;
using System;
using System.Threading.Tasks;
using System.Globalization;

namespace SEP490_G77_ESS.Services
{
    public class EmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public virtual async Task SendVerificationEmailForReset(string toEmail, string verificationLink)
        {
            {
                var emailSettings = _configuration.GetSection("EmailSettings");

                var email = new MimeMessage();
                email.From.Add(new MailboxAddress(emailSettings["SenderName"], emailSettings["SenderEmail"]));
                email.To.Add(new MailboxAddress("", toEmail));
                email.Subject = "Xác nhận tài khoản của bạn";

                email.Body = new TextPart("html")
                {
                    Text = $@"
                    <!DOCTYPE html>
                    <html lang='vi'>
                    <head>
                        <meta charset='UTF-8'>
                        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                        <title>Xác thực tài khoản</title>
                        <style>
                            body {{
                                font-family: Arial, Helvetica, sans-serif;
                                line-height: 1.6;
                                color: #333333;
                                max-width: 600px;
                                margin: 0 auto;
                                padding: 20px;
                            }}
                            .email-container {{
                                border: 1px solid #e0e0e0;
                                border-radius: 5px;
                                padding: 25px;
                                background-color: #ffffff;
                            }}
                            .header {{
                                text-align: center;
                                margin-bottom: 25px;
                                padding-bottom: 15px;
                                border-bottom: 1px solid #eeeeee;
                            }}
                            .logo {{
                                font-size: 24px;
                                font-weight: bold;
                                color: #2563eb;
                            }}
                            .content {{
                                margin-bottom: 25px;
                            }}
                            .button {{
                                display: inline-block;
                                background-color: #2563eb;
                                color: white;
                                text-decoration: none;
                                padding: 12px 24px;
                                border-radius: 4px;
                                font-weight: bold;
                                margin: 15px 0;
                                text-align: center;
                            }}
                            .button:hover {{
                                background-color: #3b7bf2;
                            }}
                            .button-container {{
                                text-align: center;
                                margin: 25px 0;
                            }}
                            .footer {{
                                font-size: 12px;
                                color: #666666;
                                margin-top: 30px;
                                text-align: center;
                                padding-top: 15px;
                                border-top: 1px solid #eeeeee;
                            }}
                            .expiry-note {{
                                color: #666666;
                                font-style: italic;
                            }}
                        </style>
                    </head>
                    <body>
                        <div class='email-container'>
                            <div class='header'>
                                <div class='logo'>Exam Support System</div>
                            </div>
                            <div class='content'>
                                <h2>Xác thực tài khoản của bạn</h2>
                                <p>Chào bạn,</p>
                                <p>Chúng tôi vừa nhận được yêu cầu thay đổi mật khẩu. Để thực hiện thay đổi mật khẩu, vui lòng nhấn vào nút bên dưới:</p>
                
                                <div class='button-container'>
                                    <a href='{verificationLink}' class='button' target='_blank' style=""color: white;"" >Thay đổi mật khẩu</a>
                                </div>
                
                                <p class='expiry-note'>Lưu ý: Liên kết này sẽ hết hạn sau 15 phút từ thời điểm nhận email.</p>
                            </div>
                            <div class='footer'>
                                <p>Đây là email tự động, vui lòng không trả lời email này.</p>
                                <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ với bộ phận hỗ trợ của chúng tôi.</p>
                                <p>&copy; 2025 Exam Support System. Đã đăng ký bản quyền.</p>
                            </div>
                        </div>
                    </body>
                    </html>"
                };

                using var smtp = new SmtpClient();
                await smtp.ConnectAsync(emailSettings["SmtpServer"], int.Parse(emailSettings["Port"]), SecureSocketOptions.StartTls);
                await smtp.AuthenticateAsync(emailSettings["SenderEmail"], emailSettings["Password"]);
                await smtp.SendAsync(email);
                await smtp.DisconnectAsync(true);
            }
        }
        public virtual async Task SendVerificationEmailAsync(string toEmail, string verificationLink)
        {
            {
                var emailSettings = _configuration.GetSection("EmailSettings");

                var email = new MimeMessage();
                email.From.Add(new MailboxAddress(emailSettings["SenderName"], emailSettings["SenderEmail"]));
                email.To.Add(new MailboxAddress("", toEmail));
                email.Subject = "Xác nhận tài khoản của bạn";

                email.Body = new TextPart("html")
                {
                    Text = $@"
                    <!DOCTYPE html>
                    <html lang='vi'>
                    <head>
                        <meta charset='UTF-8'>
                        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                        <title>Xác thực tài khoản</title>
                        <style>
                            body {{
                                font-family: Arial, Helvetica, sans-serif;
                                line-height: 1.6;
                                color: #333333;
                                max-width: 600px;
                                margin: 0 auto;
                                padding: 20px;
                            }}
                            .email-container {{
                                border: 1px solid #e0e0e0;
                                border-radius: 5px;
                                padding: 25px;
                                background-color: #ffffff;
                            }}
                            .header {{
                                text-align: center;
                                margin-bottom: 25px;
                                padding-bottom: 15px;
                                border-bottom: 1px solid #eeeeee;
                            }}
                            .logo {{
                                font-size: 24px;
                                font-weight: bold;
                                color: #2563eb;
                            }}
                            .content {{
                                margin-bottom: 25px;
                            }}
                            .button {{
                                display: inline-block;
                                background-color: #2563eb;
                                color: white;
                                text-decoration: none;
                                padding: 12px 24px;
                                border-radius: 4px;
                                font-weight: bold;
                                margin: 15px 0;
                                text-align: center;
                            }}
                            .button:hover {{
                                background-color: #3b7bf2;
                            }}
                            .button-container {{
                                text-align: center;
                                margin: 25px 0;
                            }}
                            .footer {{
                                font-size: 12px;
                                color: #666666;
                                margin-top: 30px;
                                text-align: center;
                                padding-top: 15px;
                                border-top: 1px solid #eeeeee;
                            }}
                            .expiry-note {{
                                color: #666666;
                                font-style: italic;
                            }}
                        </style>
                    </head>
                    <body>
                        <div class='email-container'>
                            <div class='header'>
                                <div class='logo'>Tên Công Ty/Dịch Vụ</div>
                            </div>
                            <div class='content'>
                                <h2>Xác thực tài khoản của bạn</h2>
                                <p>Chào bạn,</p>
                                <p>Cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất quá trình đăng ký và kích hoạt tài khoản của bạn, vui lòng nhấn vào nút bên dưới:</p>
                
                                <div class='button-container'>
                                    <a href='{verificationLink}' class='button' target='_blank'>Xác nhận tài khoản</a>
                                </div>
                
                                <p class='expiry-note'>Lưu ý: Liên kết này sẽ hết hạn sau 15 phút từ thời điểm nhận email.</p>
                            </div>
                            <div class='footer'>
                                <p>Đây là email tự động, vui lòng không trả lời email này.</p>
                                <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ với bộ phận hỗ trợ của chúng tôi.</p>
                                <p>&copy; 2025 Tên Công Ty/Dịch Vụ. Đã đăng ký bản quyền.</p>
                            </div>
                        </div>
                    </body>
                    </html>"
                };

                using var smtp = new SmtpClient();
                await smtp.ConnectAsync(emailSettings["SmtpServer"], int.Parse(emailSettings["Port"]), SecureSocketOptions.StartTls);
                await smtp.AuthenticateAsync(emailSettings["SenderEmail"], emailSettings["Password"]);
                await smtp.SendAsync(email);
                await smtp.DisconnectAsync(true);
            }
        }

        public virtual async Task SendResourceInvitationEmailAsync(
            string toEmail,
            string resourceName,
            string roleName,
            bool canModify,
            bool canDelete,
            string invitedBy,
            DateTime? invitationTime = null)
        {
            var emailSettings = _configuration.GetSection("EmailSettings");
            var sendTime = (invitationTime ?? DateTime.Now)
                .ToString("dd/MM/yyyy HH:mm:ss", CultureInfo.GetCultureInfo("vi-VN"));

            // Tạo message
            var email = new MimeMessage();
            email.From.Add(new MailboxAddress(emailSettings["SenderName"], emailSettings["SenderEmail"]));
            email.To.Add(new MailboxAddress("", toEmail));
            email.Subject = $"Bạn được mời tham gia {resourceName}";

            // Xây dựng HTML body
            var htmlBody = $@"
<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Thông báo mời tham gia</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .container {{
            border: 1px solid #e0e0e0;
            border-radius: 5px;
            padding: 25px;
            background: #fff;
        }}
        .header {{
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }}
        .logo {{
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
        }}
        .content h2 {{
            margin-top: 0;
        }}
        .detail {{
            margin: 15px 0;
        }}
        .tag {{
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            margin-right: 6px;
        }}
        .modify {{ background: #e6f7ff; color: #0050b3; }}
        .delete {{ background: #fff1f0; color: #a8071a; }}
        .footer {{
            font-size: 12px;
            color: #666;
            border-top: 1px solid #eee;
            padding-top: 10px;
            margin-top: 20px;
            text-align: center;
        }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <div class='logo'>Exam Support System</div>
        </div>
        <div class='content'>
            <h2>Thông báo lời mời</h2>
            <p>Xin chào,</p>
            <p>Bạn vừa được mời tham gia vào tài nguyên <strong>{resourceName}</strong> với vai trò <strong>{roleName}</strong> vào lúc {sendTime}.</p>
            <div class='detail'>
                <p><strong>Quyền:</strong></p>
                {(canModify ? "<span class='tag modify'>Chỉnh sửa</span>" : "")}
                {(canDelete ? "<span class='tag delete'>Xóa</span>" : "")}
            </div>
            <p><strong>Người mời:</strong> {invitedBy}</p>
        </div>
        <div class='footer'>
            <p>Đây là email tự động từ hệ thống, vui lòng không trả lời lại.</p>
            <p>&copy; 2025 Exam Support System</p>
        </div>
    </div>
</body>
</html>";

            email.Body = new TextPart("html") { Text = htmlBody };

            // Gửi qua SMTP
            using var smtp = new SmtpClient();
            await smtp.ConnectAsync(
                emailSettings["SmtpServer"],
                int.Parse(emailSettings["Port"]),
                SecureSocketOptions.StartTls);
            await smtp.AuthenticateAsync(
                emailSettings["SenderEmail"],
                emailSettings["Password"]);
            await smtp.SendAsync(email);
            await smtp.DisconnectAsync(true);
        }
    }
}

