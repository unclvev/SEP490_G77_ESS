﻿using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SEP490_G77_ESS.DTO.UserDTO;
using SEP490_G77_ESS.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SEP490_G77_ESS.Utils
{
    public class JWT
    {
        private readonly IConfiguration _configuration;
        private readonly EssDbV11Context _context;
        public JWT(IConfiguration configuration, EssDbV11Context context)
        {
            _configuration = configuration;
            _context = context;
        }

        public static string? GetUserId(string token)
        {
            if (string.IsNullOrEmpty(token))
                return null;

            if (token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                token = token.Substring("Bearer ".Length).Trim();
            }

            var handler = new JwtSecurityTokenHandler();
            var jsonToken = handler.ReadToken(token) as JwtSecurityToken;

            if (jsonToken == null)
                return null;

            var userIdClaim = jsonToken.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;

            return userIdClaim;
        }

        public static string GetUserIdFromToken(string authorizationHeader)
        {
            var token = authorizationHeader.ToString();
            return JWT.GetUserId(token);
        }

        public string CreateJWTToken(Account user)
        {
          

            List<Claim> claims = new List<Claim> {
                new Claim("AccId", user.AccId.ToString()),
                new Claim("AccName", user.Username.ToString()),
                new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", user.Email)
              
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _configuration.GetSection("AppSetting:Token").Value!));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var token = new JwtSecurityToken(
                    claims: claims,
                    expires: DateTime.UtcNow.AddHours(1),
                    signingCredentials: creds
                );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // Tạo JWT cho xác thực email
        public string CreateEmailVerificationToken(string email)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Email, email)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["AppSetting:Token"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1), // Token hết hạn sau 1 giờ
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}