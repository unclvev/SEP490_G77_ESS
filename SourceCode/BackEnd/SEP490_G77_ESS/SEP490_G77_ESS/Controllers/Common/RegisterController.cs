using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SEP490_G77_ESS.DTO.UserDTO;
using SEP490_G77_ESS.Models;
using SEP490_G77_ESS.Services;
using SEP490_G77_ESS.Utils;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace SEP490_G77_ESS.Controllers.Common
{
    [Route("api/[controller]")]
    [ApiController]
    public class RegisterController : ControllerBase
    {
        private readonly EssDbV11Context _context;
        private readonly PasswordHandler _passwordHandler;
        private readonly EmailService _emailService;

        public RegisterController(EssDbV11Context context, PasswordHandler passwordHandler, EmailService emailService)
        {
            _context = context;
            _passwordHandler = passwordHandler;
            _emailService = emailService;
        }

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

            // Tạo tài khoản mới (chưa kích hoạt)
            var account = new Account
            {
                Username = registerDto.Username,
                Email = registerDto.Email,
                Userpass = _passwordHandler.HashPassword(registerDto.Password),
                Datejoin = registerDto.Datejoin,
                IsActive = 0,
                ResetTokenExpires = DateTime.Now,
                VerificationToken = Guid.NewGuid().ToString() 
            };

            _context.Accounts.Add(account);
            await _context.SaveChangesAsync();

            // Tạo URL xác thực dựa vào token
            var verifyUrl = $"{Request.Scheme}://{Request.Host}/api/Register/VerifyEmail?token={account.VerificationToken}";

            // Gửi email xác thực
            await _emailService.SendVerificationEmailAsync(registerDto.Email, verifyUrl);

            return Ok(new { message = "Vui lòng kiểm tra email để xác thực tài khoản." });
        }

        [HttpGet("VerifyEmail")]
        public async Task<IActionResult> VerifyEmail([FromQuery] string token)
        {
            var user = _context.Accounts.FirstOrDefault(u => u.VerificationToken == token);
            if (user == null)
            {
                return NotFound(new { message = "Người dùng không tồn tại hoặc token không hợp lệ." });
            }

            // Kiểm tra thời gian xác thực: nếu quá 5 phút kể từ thời điểm đăng ký
            if (user.ResetTokenExpires.HasValue && (DateTime.Now - user.ResetTokenExpires.Value).TotalMinutes > 5)
            {
                _context.Accounts.Remove(user);
                await _context.SaveChangesAsync();
                return BadRequest(new { message = "Thời gian xác thực đã quá 5 phút, vui lòng đăng ký lại." });
            }

            // Nếu trong khoảng thời gian cho phép, kích hoạt tài khoản
            user.IsActive = 1;
            _context.Accounts.Update(user);
            await _context.SaveChangesAsync();

            return Redirect("http://localhost:3000/login");
        }
    }
}
