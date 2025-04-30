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

            var profile = new Account
            {
                Username = account.Username,
                Email = account.Email,
                Phone = account.Phone,
                Gender = account.Gender,
                Dob= account.Dob,
                IsActive = account.IsActive,
                Subject = account.Subject,
                Skill = account.Skill,
                Address = account.Address,
                Accname = account.Accname

            };

            return Ok(profile);
        }

        [HttpPut("update")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDTO updateProfileDto)
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
            account.Email = updateProfileDto.Email;
            account.Accname = updateProfileDto.Accname;
            account.Phone = updateProfileDto.Phone;
            account.Gender = updateProfileDto.Gender;
            account.Datejoin = updateProfileDto.Datejoin;
            account.Address = updateProfileDto.Address;
            account.Subject = updateProfileDto.Subject;
            account.Skill = updateProfileDto.Skill;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thông tin cá nhân thành công." });
        }

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
