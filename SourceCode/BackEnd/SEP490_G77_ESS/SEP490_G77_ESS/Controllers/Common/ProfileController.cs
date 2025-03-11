using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP490_G77_ESS.DTO.UserDTO;
using SEP490_G77_ESS.Models;
using SEP490_G77_ESS.Utils;

namespace SEP490_G77_ESS.Controllers.Common
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ProfileController : ControllerBase
    {
        private readonly EssDbV11Context _context;
        private readonly PasswordHandler _passwordHandler;

        public ProfileController(EssDbV11Context context, PasswordHandler passwordHandler)
        {
            _context = context;
            _passwordHandler = passwordHandler;
        }
        
        [HttpGet("info")]
        public async Task<IActionResult> GetProfile()
        {
            // Lấy AccId từ claims (giả sử token có chứa claim "AccId")
            var claimAccId = User.FindFirst("AccId")?.Value;
            if (string.IsNullOrEmpty(claimAccId))
            {
                return Unauthorized();
            }

            if (!long.TryParse(claimAccId, out long accId))
            {
                return BadRequest("Invalid account id in token.");
            }

            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.AccId == accId);
            if (account == null)
            {
                return NotFound("Tài khoản không tồn tại.");
            }

            // Map dữ liệu Account sang ProfileDTO
            var profile = new ProfileDTO
            {
                AccId = account.AccId,
                Username = account.Username,
                Email = account.Email,
               
            };

            return Ok(profile);
        }

        // Endpoint cập nhật thông tin cá nhân
        [HttpPut("update")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDTO updateProfileDto)
        {
            // Lấy AccId từ claims (giả sử claim "AccId" được lưu khi đăng nhập)
            var claimAccId = User.FindFirst("AccId")?.Value;
            if (string.IsNullOrEmpty(claimAccId))
            {
                return Unauthorized();
            }
            if (!long.TryParse(claimAccId, out long accId))
            {
                return BadRequest("Invalid account id in token.");
            }

            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.AccId == accId);
            if (account == null)
            {
                return NotFound("Tài khoản không tồn tại.");
            }

            account.Accname = updateProfileDto.FullName;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thông tin cá nhân thành công." });
        }

        // Endpoint đổi mật khẩu
        [HttpPut("changePassword")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDTO changePasswordDto)
        {
            var claimAccId = User.FindFirst("AccId")?.Value;
            if (string.IsNullOrEmpty(claimAccId))
            {
                return Unauthorized();
            }
            if (!long.TryParse(claimAccId, out long accId))
            {
                return BadRequest("Invalid account id in token.");
            }

            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.AccId == accId);
            if (account == null)
            {
                return NotFound("Tài khoản không tồn tại.");
            }

            // Kiểm tra mật khẩu cũ
            if (!_passwordHandler.VerifyPassword(changePasswordDto.OldPassword, account.Userpass))
            {
                return BadRequest(new { message = "Mật khẩu cũ không đúng." });
            }

            // Kiểm tra mật khẩu mới và xác nhận mật khẩu mới có khớp không
            if (changePasswordDto.NewPassword != changePasswordDto.ConfirmNewPassword)
            {
                return BadRequest(new { message = "Mật khẩu mới và xác nhận không khớp." });
            }

            // Cập nhật mật khẩu mới (đã được hash)
            account.Userpass = _passwordHandler.HashPassword(changePasswordDto.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đổi mật khẩu thành công." });
        }
    }
}
