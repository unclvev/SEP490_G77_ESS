using Microsoft.IdentityModel.Tokens;
using SEP490_G77_ESS.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;


namespace SEP490_G77_ESS.Utils
{
    public class JWT
    {
        private readonly IConfiguration _configuration;
        public JWT(IConfiguration configuration)
        {
            _configuration = configuration;
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

        public string CreateJWTToken(Account user, string role)
        {
            List<Claim> claims = new List<Claim> {
                new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", user.Email),
                new Claim("http://schemas.microsoft.com/ws/2008/06/identity/claims/role", role)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _configuration.GetSection("AppSetting:Token").Value!));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var token = new JwtSecurityToken(

                    claims: claims,
                    expires: DateTime.Now.AddMinutes(30),
                    signingCredentials: creds
                );

            var jwt = new JwtSecurityTokenHandler().WriteToken(token);

            return jwt;
        }
    }
}

