using DocumentFormat.OpenXml.Spreadsheet;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP490_G77_ESS.Models;
using SEP490_G77_ESS.Utils;

namespace SEP490_G77_ESS.Controllers.Common
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthGoogleController : ControllerBase
    {

        private readonly EssDbV11Context _context;
        private readonly IConfiguration _config;
        private readonly JWT _jwt;


        public AuthGoogleController(EssDbV11Context context, IConfiguration config, JWT jwt)
        {
            _context = context;
            _config = config;
            _jwt = jwt;
        }

        [HttpPost("api/GoogleLogin")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto request)
        {
            try
            {
                var payload = await GoogleJsonWebSignature.ValidateAsync(request.Token);

                var user = await _context.Accounts.FirstOrDefaultAsync(u => u.Email == payload.Email);
                if (user == null)
                {
                    user = new Account
                    {
                        Email = payload.Email,
                        Username = payload.Name,
                       
                    };
                    _context.Accounts.Add(user);
                    await _context.SaveChangesAsync();
                }

                var jwtToken = _jwt.CreateJWTToken(user);
                return Ok(new { jwt = jwtToken });
            }
            catch (Exception ex)
            {
                return Unauthorized("Google login failed");
            }
        }


    }

    public class GoogleLoginDto
    {
        public string Token { get; set; }
    }
}

