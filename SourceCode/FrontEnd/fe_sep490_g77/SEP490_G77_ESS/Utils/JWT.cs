using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace SEP490_G77_ESS.Utils
{
    public class JWT
    {
        private readonly IConfiguration _configuration;

        public JWT(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string CreateJWTToken(Account user)
        {
            List<Claim> claims = new List<Claim> {
                new Claim("AccId", user.AccId.ToString()),
                new Claim("AccName", user.Username.ToString()),
                new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", user.Email)
            };

            foreach (var access in user.ResourceAccesses)
            {
                claims.Add(new Claim(ClaimTypes.Role, access.Role.RoleName));
                claims.Add(new Claim("canRead", access.Role.CanRead.ToString()));
                claims.Add(new Claim("canModify", access.Role.CanModify.ToString()));
                claims.Add(new Claim("canDelete", access.Role.CanDelete.ToString()));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _configuration.GetSection("AppSetting:Token").Value!));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var token = new JwtSecurityToken(
                    claims: claims,
                    expires: DateTime.Now.AddMinutes(15), // Tăng thời gian hết hạn lên 15 phút
                    signingCredentials: creds
                );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
} 