using NUnit.Framework;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using SEP490_G77_ESS.Controllers.Common;
using SEP490_G77_ESS.Models;
using SEP490_G77_ESS.DTO.UserDTO;
using SEP490_G77_ESS.Utils;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace SEP490_G77_ESS.Tests.Controller.Commons
{
    [TestFixture]
    public class LoginControllerTests
    {
        private EssDbV11Context _context;
        private LoginController _controller;
        private PasswordHandler _passwordHandler;
        private JWT _jwt;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<EssDbV11Context>()
                .UseInMemoryDatabase(databaseName: "TestDb_Login")
                .Options;

            _context = new EssDbV11Context(options);
            _context.Database.EnsureDeleted();
            _context.Database.EnsureCreated();

            _passwordHandler = new PasswordHandler();

            // 👇 Fake configuration for JWT
            var inMemorySettings = new Dictionary<string, string> {
    {"AppSetting:Token", "this_is_test_secret_key_that_has_more_than_64_bytes_length_1234567890_ABCDEFG"}
};

            IConfiguration configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();

            _jwt = new JWT(configuration);
            _controller = new LoginController(_context, _jwt, _passwordHandler);

            var hashed = _passwordHandler.HashPassword("password123");
            _context.Accounts.Add(new Account
            {
                AccId = 1,
                Username = "TestUser",
                Email = "user@example.com",
                Userpass = hashed
            });
            _context.SaveChanges();
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        [Test]
        public void Login_InvalidEmail_ReturnsUnauthorized()
        {
            Console.WriteLine("Login failed for email = notfound@example.com");
            var loginDto = new LoginDTO
            {
                Username = "notfound@example.com",
                Password = "password123"
            };

            var result = _controller.Login(loginDto);

            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>());
        }

        [Test]
        public void Login_WrongPassword_ReturnsUnauthorized()
        {
            Console.WriteLine("Login failed for email = user@example.com");
            var loginDto = new LoginDTO
            {
                Username = "user@example.com",
                Password = "wrongpassword"
            };

            var result = _controller.Login(loginDto);

            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>());
        }

        [Test]
        public void Login_InvalidEmailFormat_ReturnsUnauthorized()
        {
            Console.WriteLine("Login failed for email = invalid_email");
            var loginDto = new LoginDTO
            {
                Username = "invalid_email",
                Password = "password123"
            };

            var result = _controller.Login(loginDto);

            // Trong API gốc không validate format, nên vẫn là Unauthorized nếu không tìm thấy
            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>());
        }

        [Test]
        public void Login_EmptyEmail_ReturnsUnauthorized()
        {
            Console.WriteLine("Login failed for email = ");
            var loginDto = new LoginDTO
            {
                Username = "",
                Password = "password123"
            };

            var result = _controller.Login(loginDto);

            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>());
        }

        [Test]
        public void Login_ValidCredentials_ReturnsToken()
        {
            Console.WriteLine("Login success with account email = user@example.com");
            var loginDto = new LoginDTO
            {
                Username = "user@example.com",
                Password = "password123"
            };

            var actionResult = _controller.Login(loginDto);
            Console.WriteLine("Actual result type: " + actionResult?.GetType()?.FullName);

            Assert.That(actionResult, Is.TypeOf<OkObjectResult>(), "Expected OkObjectResult");

            var ok = actionResult as OkObjectResult;
            Assert.That(ok, Is.Not.Null, "Result is null");

            Console.WriteLine("Returned value: " + ok.Value?.ToString());
            Assert.That(ok.Value?.ToString(), Does.Contain("token"), "Token not found in response");
        }


    }
}
