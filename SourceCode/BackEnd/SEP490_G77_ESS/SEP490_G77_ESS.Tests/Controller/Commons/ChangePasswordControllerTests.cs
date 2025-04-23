using NUnit.Framework;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP490_G77_ESS.Controllers.Common;
using SEP490_G77_ESS.Models;
using SEP490_G77_ESS.Utils;
using SEP490_G77_ESS.DTO.UserDTO;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace SEP490_G77_ESS.Tests.Controller.Commons
{
    [TestFixture]
    public class ChangePasswordControllerTests
    {
        private EssDbV11Context _context;
        private ProfileController _controller;
        private PasswordHandler _passwordHandler;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<EssDbV11Context>()
                .UseInMemoryDatabase(databaseName: "TestDb_ChangePassword")
                .Options;
            _context = new EssDbV11Context(options);
            _context.Database.EnsureDeleted();
            _context.Database.EnsureCreated();

            _passwordHandler = new PasswordHandler();
            _controller = new ProfileController(_context, _passwordHandler);

            _context.Accounts.Add(new Account
            {
                AccId = 1,
                Username = "user1",
                Email = "user1@example.com",
                Userpass = _passwordHandler.HashPassword("oldpassword")
            });
            _controller.ControllerContext = new ControllerContext
{
    HttpContext = new DefaultHttpContext()
};

            _context.SaveChanges();
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        private void SetUserWithClaim(string accId)
        {
            var claims = new List<Claim> { new Claim("AccId", accId) };
            var identity = new ClaimsIdentity(claims, "test");
            var user = new ClaimsPrincipal(identity);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };
        }

        [Test]
        public async Task ChangePassword_NoToken_ReturnsUnauthorized()
        {
            Console.WriteLine("Change password failed - missing token");
            var result = await _controller.ChangePassword(new ChangePasswordDTO());
            Assert.That(result, Is.TypeOf<UnauthorizedResult>());
        }

        [Test]
        public async Task ChangePassword_InvalidAccId_ReturnsBadRequest()
        {
            Console.WriteLine("Change password failed - invalid AccId format");
            SetUserWithClaim("invalid");
            var result = await _controller.ChangePassword(new ChangePasswordDTO());
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task ChangePassword_AccountNotFound_ReturnsNotFound()
        {
            Console.WriteLine("Change password failed - account not found");
            SetUserWithClaim("9999");
            var result = await _controller.ChangePassword(new ChangePasswordDTO());
            Assert.That(result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task ChangePassword_WrongOldPassword_ReturnsBadRequest()
        {
            Console.WriteLine("Change password failed - wrong old password");
            SetUserWithClaim("1");
            var dto = new ChangePasswordDTO
            {
                OldPassword = "wrongpassword",
                NewPassword = "newpass123",
                ConfirmNewPassword = "newpass123"
            };
            var result = await _controller.ChangePassword(dto);
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task ChangePassword_MismatchConfirmation_ReturnsBadRequest()
        {
            Console.WriteLine("Change password failed - new password mismatch confirmation");
            SetUserWithClaim("1");
            var dto = new ChangePasswordDTO
            {
                OldPassword = "oldpassword",
                NewPassword = "newpass123",
                ConfirmNewPassword = "differentpass"
            };
            var result = await _controller.ChangePassword(dto);
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task ChangePassword_ValidChange_ReturnsOk()
        {
            Console.WriteLine("Change password success");
            SetUserWithClaim("1");
            var dto = new ChangePasswordDTO
            {
                OldPassword = "oldpassword",
                NewPassword = "newpass123",
                ConfirmNewPassword = "newpass123"
            };
            var result = await _controller.ChangePassword(dto);
            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }
    }
}
