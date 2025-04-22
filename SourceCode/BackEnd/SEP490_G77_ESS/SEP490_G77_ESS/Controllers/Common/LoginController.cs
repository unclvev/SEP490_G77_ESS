using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP490_G77_ESS.DTO.UserDTO;
using SEP490_G77_ESS.Models;
using SEP490_G77_ESS.Utils;
using System;
using System.Linq;
using System.Security.Cryptography;

namespace SEP490_G77_ESS.Controllers.Common
{
    [Route("api/[controller]")]
    [ApiController]
    public class LoginController : ControllerBase
    {
        private readonly EssDbV11Context _context;
        private readonly JWT _jwt;
        private readonly PasswordHandler _passwordHandler;

        public LoginController(EssDbV11Context context, JWT jwt, PasswordHandler passwordHandler)
        {
            _context = context;
            _jwt = jwt;
            _passwordHandler = passwordHandler;
        }

        [HttpPost]
        public IActionResult Login([FromBody] LoginDTO loginDto)
        {
            var user = _context.Accounts
                .Include(a => a.ResourceAccesses)
                  .ThenInclude(ra => ra.Role)
                .FirstOrDefault(x => x.Email == loginDto.Username);


            if (user == null || !_passwordHandler.VerifyPassword(loginDto.Password, user.Userpass))
                return Unauthorized(new { message = "Sai tên đăng nhập hoặc mật khẩu" });

            if (user.IsActive == 0)
            {
                return Unauthorized(new { message = "Tài khoản đã bị chưa xác thực" });
            }
            // Tạo accessToken và refreshToken
            var accessToken = _jwt.CreateJWTToken(user);
            var refreshTokenEntity = GenerateRefreshToken();
            SaveRefreshToken(user, refreshTokenEntity);

            return Ok(new
            {
                accessToken,
                refreshToken = refreshTokenEntity.Token,
                expiresIn = 15 * 60
            });
        }

        [HttpPost("refresh")]
        public IActionResult RefreshToken([FromBody] RefreshTokenRequest request)
        {
            var tokenEntity = _context.RefreshTokens
                .FirstOrDefault(t => t.Token == request.RefreshToken);

            if (tokenEntity == null || tokenEntity.Expires < DateTime.UtcNow)
                return Unauthorized(new { message = "Refresh token không hợp lệ hoặc đã hết hạn" });

            var user = _context.Accounts.Find(tokenEntity.AccountId);
            if (user == null)
                return Unauthorized(new { message = "Người dùng không tồn tại" });

            var newAccessToken = _jwt.CreateJWTToken(user);
            return Ok(new { accessToken = newAccessToken });
        }

        private RefreshToken GenerateRefreshToken()
        {
            return new RefreshToken
            {
                Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
                Expires = DateTime.UtcNow.AddDays(7),
                Created = DateTime.UtcNow
            };
        }

        private void SaveRefreshToken(Account account, RefreshToken refreshToken)
        {
            refreshToken.AccountId = account.AccId;
            _context.RefreshTokens.Add(refreshToken);
            _context.SaveChanges();

            Response.Cookies.Append("refreshToken", refreshToken.Token, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                Expires = refreshToken.Expires
            });
        }
    }
}
