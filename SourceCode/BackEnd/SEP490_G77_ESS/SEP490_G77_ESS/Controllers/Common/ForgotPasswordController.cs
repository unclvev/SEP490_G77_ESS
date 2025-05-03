using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP490_G77_ESS.DTO.UserDTO;
using SEP490_G77_ESS.Models;
using SEP490_G77_ESS.Services;
using SEP490_G77_ESS.Utils;

namespace SEP490_G77_ESS.Controllers.Common
{
    [Route("api/[controller]")]
    [ApiController]
    public class ForgotPasswordController : ControllerBase
    {
        private readonly EssDbV11Context _context;
        private readonly EmailService _emailService;
        private readonly PasswordHandler _passwordHandler;


        public ForgotPasswordController(EssDbV11Context context, EmailService emailService, PasswordHandler passwordHandler)
        {
            _context = context;
            _emailService = emailService;
            _passwordHandler = passwordHandler;
        }

        [HttpGet("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromQuery] string email)
        {
            var account = await _context.Accounts.FirstOrDefaultAsync(u => u.Email == email);
            if (account == null)
            {
                return NotFound(new { message = "Email không tồn tại" });
            }

            account.PasswordResetToken = Guid.NewGuid().ToString();
            account.ResetTokenExpires = DateTime.Now;
            var resetUrl = $"{Request.Scheme}://{Request.Host}/api/ForgotPassword/verify-email-for-password?token={account.PasswordResetToken}";

            await _emailService.SendVerificationEmailForReset(email, resetUrl);

            await _context.SaveChangesAsync();
            return Ok(new { message = "Vui lòng kiểm tra email để xác thực và đặt lại mật khẩu." });
        }

        [HttpGet("verify-email-for-password")]
        public async Task<IActionResult> VerifyEmailForPassword([FromQuery] string token)
        {
            var account = await _context.Accounts.FirstOrDefaultAsync(u => u.PasswordResetToken == token);
            if (account == null)
            {
                return NotFound(new { message = "Người dùng không tồn tại hoặc token không hợp lệ." });
            }

            
            if (account.ResetTokenExpires.HasValue && (DateTime.Now - account.ResetTokenExpires.Value).TotalMinutes > 5)
            {
                account.PasswordResetToken = null;
                _context.Accounts.Update(account);
                await _context.SaveChangesAsync();
                return BadRequest(new { message = "Thời gian xác thực đã quá 15 phút, vui lòng đăng ký lại." });
            }

            return Redirect($"http://localhost:3000/reset-password?token={token}");
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            var account = await _context.Accounts.FirstOrDefaultAsync(u => u.PasswordResetToken == request.Token);
            if (account == null)
            {
                return NotFound(new { message = "Token không hợp lệ" });
            }
            if (account.Userpass == request.NewPassword)
            {
                return Conflict("Mật khẩu mới không nên trùng với mật khẩu cũ");
            }
            
            account.Userpass = _passwordHandler.HashPassword(request.NewPassword);
            account.PasswordResetToken = null;

            _context.Accounts.Update(account);
            await _context.SaveChangesAsync();

            return Ok("Đã cập nhật thành công");
        }


    }
}