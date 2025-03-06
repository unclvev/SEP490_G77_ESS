using AuthenticationService.DTO;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SEP490_G77_ESS.DTO.UserDTO;
using SEP490_G77_ESS.Models;
using SEP490_G77_ESS.Services;
using SEP490_G77_ESS.Utils;
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
        private readonly JWT _jwt;

        public RegisterController(EssDbV11Context context, PasswordHandler passwordHandler, EmailService emailService, JWT jwt)
        {
            _context = context;
            _passwordHandler = passwordHandler;
            _emailService = emailService;
            _jwt = jwt;
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
                Datejoin = DateTime.UtcNow,
                //IsActive = false
            };

            _context.Accounts.Add(account);
            await _context.SaveChangesAsync();

            // Tạo JWT xác thực email
            var verificationToken = _jwt.CreateEmailVerificationToken(account.Email);
            var verifyUrl = $"{Request.Scheme}://{Request.Host}/api/Register/VerifyEmail?token={verificationToken}";

            // Gửi email xác thực
            await _emailService.SendVerificationEmailAsync(registerDto.Email, verifyUrl);

            return Ok(new { message = "Vui lòng kiểm tra email để xác thực tài khoản." });
        }

        [HttpGet("VerifyEmail")]
        public async Task<IActionResult> VerifyEmail([FromQuery] string token)
        {
            var email = JWT.GetUserId(token);
            if (email == null)
            {
                return BadRequest(new { message = "Token không hợp lệ hoặc đã hết hạn." });
            }

            var user = _context.Accounts.FirstOrDefault(u => u.Email == email);
            if (user == null)
            {
                return NotFound(new { message = "Người dùng không tồn tại." });
            }

            //user.IsActive = true;
            user.Roleid = 1;
            _context.Accounts.Update(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ." });
        }
    }
}
