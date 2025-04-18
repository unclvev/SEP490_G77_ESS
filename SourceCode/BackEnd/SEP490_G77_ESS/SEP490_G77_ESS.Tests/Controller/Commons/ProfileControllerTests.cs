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
    public class ProfileControllerTests
    {
        private EssDbV11Context _context;
        private ProfileController _controller;
        private PasswordHandler _passwordHandler;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<EssDbV11Context>()
                .UseInMemoryDatabase(databaseName: "TestDb_Profile")
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
                Userpass = _passwordHandler.HashPassword("password123"),
                Phone = "0123456789"
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
        public async Task UpdateProfile_NoToken_ReturnsUnauthorized()
        {
            Console.WriteLine("Update profile failed - missing token");
            var result = await _controller.UpdateProfile(new UpdateProfileDTO());
            Assert.That(result, Is.TypeOf<UnauthorizedResult>());
        }

        [Test]
        public async Task UpdateProfile_InvalidTokenFormat_ReturnsBadRequest()
        {
            Console.WriteLine("Update profile failed - invalid AccId format in token");
            SetUserWithClaim("invalid");
            var result = await _controller.UpdateProfile(new UpdateProfileDTO());
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task UpdateProfile_AccIdNotFound_ReturnsNotFound()
        {
            Console.WriteLine("Update profile failed - AccId not found");
            SetUserWithClaim("9999");
            var result = await _controller.UpdateProfile(new UpdateProfileDTO());
            Assert.That(result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task UpdateProfile_InvalidPhone_ReturnsOk()
        {
            Console.WriteLine("Update profile passed - phone invalid but system accepts (no strict validation)");
            SetUserWithClaim("1");
            var dto = new UpdateProfileDTO { Phone = "123" };
            var result = await _controller.UpdateProfile(dto);
            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task UpdateProfile_MissingFields_ReturnsOk()
        {
            Console.WriteLine("Update profile passed - missing optional fields");
            SetUserWithClaim("1");
            var dto = new UpdateProfileDTO { Email = "", Accname = "" };
            var result = await _controller.UpdateProfile(dto);
            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task UpdateProfile_ValidUpdate_ReturnsOk()
        {
            Console.WriteLine("Update profile success");
            SetUserWithClaim("1");
            var dto = new UpdateProfileDTO
            {
                Email = "newuser@example.com",
                Accname = "New Name",
                Phone = "0987654321",
                Address = "New Address",
                Subject = "Math",
                Gender = "Male",
                Datejoin = new System.DateTime(2000, 1, 1)
            };
            var result = await _controller.UpdateProfile(dto);
            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }
    }
}
