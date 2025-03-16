using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SEP490_G77_ESS.DTO.UserDTO;
using SEP490_G77_ESS.Models;
using SEP490_G77_ESS.Utils;
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
        private static Account user = new Account();

        public LoginController(EssDbV11Context context, JWT jwt, PasswordHandler passwordHandler)
        {
            _context = context;
            _jwt = jwt;
            _passwordHandler = passwordHandler;
        }

        [HttpPost]
        
        public IActionResult Login([FromBody] LoginDTO user)
        {
            var userLogin = _context.Accounts.FirstOrDefault(x => x.Email == user.Username);
            if (userLogin == null || !_passwordHandler.VerifyPassword(user.Password, userLogin.Userpass))
            {
                return Unauthorized(new { message = "Invalid username or password" });
            }
            var jwt = _jwt.CreateJWTToken(userLogin, 1);


            //var refreshToken = GenerateRefreshToken();
            //SetRefreshToken(refreshToken);

            return Ok(jwt);
            
        }
        //private RefreshToken GenerateRefreshToken()
        //{
        //    var refreshToken = new RefreshToken
        //    {
        //        Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
        //        Expires = DateTime.Now.AddDays(7),
        //        Created = DateTime.Now
        //    };

        //    return refreshToken;
        //}
        //private void SetRefreshToken(RefreshToken newRefreshToken)
        //{
        //    var cookieOptions = new CookieOptions
        //    {
        //        HttpOnly = true,
        //        Expires = newRefreshToken.Expires
        //    };
        //    Response.Cookies.Append("refreshToken", newRefreshToken.Token, cookieOptions);

        //    user.re = newRefreshToken.Token;
        //    user.RefreshTokenCreate = newRefreshToken.Created;
        //    user.RefreshTokenExpiryTime = newRefreshToken.Expires;
        //}
    }
}
