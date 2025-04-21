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

        public LoginController(EssDbV11Context context, JWT jwt, PasswordHandler passwordHandler)
        {
            _context = context;
            _jwt = jwt;
            _passwordHandler = passwordHandler;
        }

        [HttpPost]
        public IActionResult Login([FromBody] LoginDTO loginDto)
        {
            var userLogin = _context.Accounts.FirstOrDefault(x => x.Email == loginDto.Username);
            if (userLogin == null || !_passwordHandler.VerifyPassword(loginDto.Password, userLogin.Userpass))
            {
                return Unauthorized(new { message = "Sai tên đăng nhập hoặc mật khẩu" });
            }

            // Tạo JWT với thông tin user và role (ở đây role truyền vào là 1, có thể thay đổi theo nhu cầu)
            var jwtToken = _jwt.CreateJWTToken(userLogin);

            // Nếu muốn sử dụng refresh token, tạo và thiết lập cho người dùng
            //var refreshToken = GenerateRefreshToken();
            //SaveRefreshToken(userLogin, refreshToken);

            // Lưu các thay đổi vào cơ sở dữ liệu
            _context.SaveChanges();

            return Ok(new { token = jwtToken});
        }

        private RefreshToken GenerateRefreshToken()
        {
            var refreshToken = new RefreshToken
            {
                Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
                Expires = DateTime.Now.AddDays(7),
                Created = DateTime.Now
            };
            return refreshToken;
        }

        private void SaveRefreshToken(Models.Account account, RefreshToken newRefreshToken)
        {
            // Thiết lập thông tin khóa ngoại
            newRefreshToken.AccountId = account.AccId;

            // Thêm refresh token vào DbSet
            _context.RefreshTokens.Add(newRefreshToken);

            // Thiết lập cookie cho refresh token
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Expires = newRefreshToken.Expires
            };
            Response.Cookies.Append("refreshToken", newRefreshToken.Token, cookieOptions);
        }

    }
}
