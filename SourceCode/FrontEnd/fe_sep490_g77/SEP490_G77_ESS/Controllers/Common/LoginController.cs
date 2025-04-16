using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace SEP490_G77_ESS.Controllers.Common
{
    [Route("api/[controller]")]
    [ApiController]
    public class LoginController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHandler _passwordHandler;
        private readonly IJwt _jwt;

        public LoginController(AppDbContext context, IPasswordHandler passwordHandler, IJwt jwt)
        {
            _context = context;
            _passwordHandler = passwordHandler;
            _jwt = jwt;
        }

        [HttpPost]
        public IActionResult Login([FromBody] LoginDTO loginDto)
        {
            var userLogin = _context.Accounts.Include(a => a.ResourceAccesses)
                                             .ThenInclude(ra => ra.Role)
                                             .FirstOrDefault(x => x.Email == loginDto.Username);
            if (userLogin == null || !_passwordHandler.VerifyPassword(loginDto.Password, userLogin.Userpass))
            {
                return Unauthorized(new { message = "Sai tên đăng nhập hoặc mật khẩu" });
            }

            // Tạo JWT token
            var jwtToken = _jwt.CreateJWTToken(userLogin);

            // Tạo refresh token
            var refreshToken = GenerateRefreshToken();
            SaveRefreshToken(userLogin, refreshToken);

            return Ok(new { 
                token = jwtToken, 
                refreshToken = refreshToken.Token,
                expiresIn = 15 * 60 // Thời gian hết hạn của JWT token (15 phút)
            });
        }

        [HttpPost("refresh")]
        public IActionResult RefreshToken([FromBody] string refreshToken)
        {
            var token = _context.RefreshTokens
                .Include(rt => rt.Account)
                .ThenInclude(a => a.ResourceAccesses)
                .ThenInclude(ra => ra.Role)
                .FirstOrDefault(t => t.Token == refreshToken && !t.Revoked.HasValue);

            if (token == null || token.Expires < DateTime.Now)
            {
                return Unauthorized(new { message = "Refresh token không hợp lệ hoặc đã hết hạn" });
            }

            // Tạo JWT token mới
            var newAccessToken = _jwt.CreateJWTToken(token.Account);

            // Tạo refresh token mới
            var newRefreshToken = GenerateRefreshToken();
            
            // Đánh dấu refresh token cũ là đã thu hồi
            token.Revoked = DateTime.Now;
            
            // Lưu refresh token mới
            SaveRefreshToken(token.Account, newRefreshToken);

            return Ok(new { 
                accessToken = newAccessToken, 
                refreshToken = newRefreshToken.Token,
                expiresIn = 15 * 60
            });
        }

        private RefreshToken GenerateRefreshToken()
        {
            var refreshToken = new RefreshToken
            {
                Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
                Expires = DateTime.Now.AddDays(7), // Refresh token có thời hạn 7 ngày
                Created = DateTime.Now
            };
            return refreshToken;
        }

        private void SaveRefreshToken(Account account, RefreshToken newRefreshToken)
        {
            newRefreshToken.AccountId = account.AccId;
            _context.RefreshTokens.Add(newRefreshToken);
            _context.SaveChanges();

            // Thiết lập cookie cho refresh token với các tùy chọn bảo mật
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Expires = newRefreshToken.Expires,
                Secure = true,
                SameSite = SameSiteMode.Strict
            };
            Response.Cookies.Append("refreshToken", newRefreshToken.Token, cookieOptions);
        }
    }
} 