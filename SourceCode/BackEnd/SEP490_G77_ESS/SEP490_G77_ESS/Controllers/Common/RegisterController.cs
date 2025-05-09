﻿using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SEP490_G77_ESS.DTO.UserDTO;
using SEP490_G77_ESS.Models;
using SEP490_G77_ESS.Services;
using SEP490_G77_ESS.Utils;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace SEP490_G77_ESS.Controllers.Common
{
    [Route("api/[controller]")]
    [ApiController]
    public class RegisterController : ControllerBase
    {
        private readonly EssDbV11Context _context;
        private readonly PasswordHandler _passwordHandler;
        private readonly EmailService _emailService;

        public RegisterController(EssDbV11Context context, PasswordHandler passwordHandler, EmailService emailService)
        {
            _context = context;
            _passwordHandler = passwordHandler;
            _emailService = emailService;
        }

        [HttpPost]
        public async Task<IActionResult> Register([FromBody] RegisterDTO registerDto)
        {
            if (string.IsNullOrWhiteSpace(registerDto.Username) ||
                string.IsNullOrWhiteSpace(registerDto.Password) ||
                string.IsNullOrWhiteSpace(registerDto.Email) ||
                string.IsNullOrWhiteSpace(registerDto.Phone) ||
                registerDto.Dob == null)
            {
                return BadRequest(new { message = "Tất cả các trường đều bắt buộc" });
            }

            if (string.IsNullOrWhiteSpace(registerDto.Username) || string.IsNullOrWhiteSpace(registerDto.Password))
            {
                return BadRequest(new { message = "Username and password are required" });
            }

            if (_context.Accounts.Any(u => u.Email == registerDto.Email))
            {
                return Conflict(new { message = "Email đã tồn tại" });
            }

            if (!System.Text.RegularExpressions.Regex.IsMatch(registerDto.Phone, @"^\d{10}$"))
            {
                return BadRequest(new { message = "Số điện thoại phải gồm đúng 10 chữ số" });
            }

            if (registerDto.Dob > DateTime.Now)
            {
                return BadRequest(new { message = "Ngày sinh không thể là ngày trong tương lai" });
            }
            
            int age = DateTime.Now.Year - registerDto.Dob.Value.Year;
            if (registerDto.Dob > DateTime.Now.AddYears(-age))
            {
                age--;
            }
            if (age < 18)
            {
                return BadRequest(new { message = "Bạn phải đủ 18 tuổi để đăng ký" });
            }


            var account = new Account
            {
                Username = registerDto.Username,
                Email = registerDto.Email,
                Userpass = _passwordHandler.HashPassword(registerDto.Password),
                Dob = registerDto.Dob,
                IsActive = 0,
                Datejoin = DateTime.UtcNow,
                ResetTokenExpires = DateTime.UtcNow,
                VerificationToken = Guid.NewGuid().ToString() 
            };

            _context.Accounts.Add(account);
            await _context.SaveChangesAsync();

            // Tạo URL xác thực dựa vào token
            var verifyUrl = $"{Request.Scheme}://{Request.Host}/api/Register/VerifyEmail?token={account.VerificationToken}";

            // Gửi email xác thực
            await _emailService.SendVerificationEmailAsync(registerDto.Email, verifyUrl);

            return Ok(new { message = "Vui lòng kiểm tra email để xác thực tài khoản." });
        }

        [HttpGet("VerifyEmail")]
        public async Task<IActionResult> VerifyEmail([FromQuery] string token)
        {
            var user = _context.Accounts.FirstOrDefault(u => u.VerificationToken == token);
            if (user == null)
            {
                return Redirect($"http://localhost:3000/error/{Uri.EscapeDataString("Mã của bạn không hợp lệ.")}");
            }

            if (!user.ResetTokenExpires.HasValue || DateTime.UtcNow > user.ResetTokenExpires.Value.AddMinutes(15))
            {
                _context.Accounts.Remove(user);
                await _context.SaveChangesAsync();
                return Redirect($"http://localhost:3000/error/{Uri.EscapeDataString("Mã của bạn đã hết hạn vui lòng đắng ký lại.")}");
            }

            user.IsActive = 1;
            _context.Accounts.Update(user);
            await _context.SaveChangesAsync();

            return Redirect("http://localhost:3000/login");
        }


    }
}
