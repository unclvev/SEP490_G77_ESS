using AuthenticationService.DTO;
using AuthenticationService.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SEP490_G77_ESS.DTO.UserDTO;
using SEP490_G77_ESS.Models;
using SEP490_G77_ESS.Utils;
using System.Text.Json;

namespace SEP490_G77_ESS.Controllers.Common
{
    [Route("api/[controller]")]
    [ApiController]
    public class RegisterController : ControllerBase
    {
        private readonly EssDbV11Context _context;
        private readonly PasswordHandler _passwordHandler;
        private readonly Email _email;
        public RegisterController(EssDbV11Context context, PasswordHandler passwordHandler, Email email)
        {
            _context = context;
            _passwordHandler = passwordHandler;
            _email = email;
        }

        //[HttpPost]
        //public async Task<IActionResult> Register([FromBody] RegisterDTO registerDto)
        //{
        //    if (string.IsNullOrWhiteSpace(registerDto.Username) || string.IsNullOrWhiteSpace(registerDto.Password))
        //    {
        //        return BadRequest(new { message = "Username and password are required" });
        //    }

        //    if (_context.Accounts.Any(u => u.Email == registerDto.Email))
        //    {
        //        return StatusCode(StatusCodes.Status409Conflict, new { message = "Email đã tồn tại" });
        //    }

        //    // Generate OTP
        //    var otp = new Random().Next(100000, 999999).ToString();

        //    // Save OTP and other temporary info in cookies
        //    var userData = JsonSerializer.Serialize(registerDto);
        //    Response.Cookies.Append("TempUserData", userData, new CookieOptions
        //    {
        //        HttpOnly = true, // Cookie không thể truy cập từ JavaScript
        //        SameSite = SameSiteMode.Lax, // Đảm bảo gửi cookie qua các yêu cầu CORS
        //        Secure = false, // Đặt là true nếu sử dụng HTTPS
        //        Expires = DateTime.UtcNow.AddMinutes(10) // Cookie hết hạn sau 10 phút
        //    });

        //    Response.Cookies.Append("Otp", otp, new CookieOptions
        //    {
        //        HttpOnly = true,
        //        SameSite = SameSiteMode.Lax,
        //        Secure = false,
        //        Expires = DateTime.UtcNow.AddMinutes(10)
        //    });

        //    Response.Cookies.Append("OtpExpiry", DateTime.UtcNow.AddMinutes(10).ToString(), new CookieOptions
        //    {
        //        HttpOnly = true,
        //        SameSite = SameSiteMode.Lax,
        //        Secure = false,
        //        Expires = DateTime.UtcNow.AddMinutes(10)
        //    });

        //   //Send OTP email
        //   var mailRequest = new Mailrequest
        //   {
        //       Email = registerDto.Email,
        //       Subject = "Your OTP Code",
        //       Emailbody = $"<h1>Hello, {registerDto.Username}!</h1><p>Your OTP code is: <strong>{otp}</strong></p><p>This code will expire in 10 minutes.</p>"
        //   };

        //    await _email.SendEmailAsync(mailRequest);

        //    return Ok(new { message = "OTP sent to email." });
        //}
        [HttpPost]
        public async Task<IActionResult> Register([FromBody] RegisterDTO registerDto)
        {
            if (string.IsNullOrWhiteSpace(registerDto.Username) || string.IsNullOrWhiteSpace(registerDto.Password))
            {
                return BadRequest(new { message = "Username and password are required" });
            }

            if (_context.Accounts.Any(u => u.Email == registerDto.Email))
            {
                return Conflict(new { message = "Email đã tồn tại" });
            }

            // Tạo verification token
            var verificationToken = Guid.NewGuid().ToString();

            // Tạo tài khoản mới (chưa kích hoạt)
            var account = new Account
            {
                Username = registerDto.Username,
                Email = registerDto.Email,
                Userpass = _passwordHandler.HashPassword(registerDto.Password),
                Datejoin = DateTime.UtcNow,
                VerificationToken = verificationToken,
                // Thiết lập Role mặc định nếu cần, ví dụ:
                Roleid = 1
            };

            _context.Accounts.Add(account);
            await _context.SaveChangesAsync();

            // Tạo đường link xác thực. Sử dụng Url.Action để xây dựng link theo routing hiện tại.
            var verifyUrl = Url.Action("VerifyEmail", "Account", new { token = verificationToken }, Request.Scheme);

            //Gửi email chứa đường link xác thực(đoạn code gửi email được comment để bạn tích hợp với dịch vụ email của mình)

            var mailRequest = new Mailrequest
            {
                Email = registerDto.Email,
                Subject = "Xác thực Email của bạn",
                Emailbody = $"<p>Xin chào {registerDto.Username},</p>" +
                            $"<p>Vui lòng nhấn vào link sau để xác thực email: <a href='{verifyUrl}'>Xác thực Email</a></p>" +
                            "<p>Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này.</p>"
            };

            await _email.SendEmailAsync(mailRequest);


            return Ok(new { message = "Vui lòng kiểm tra email để xác thực tài khoản." });
        }

    }
}
