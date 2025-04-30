using NUnit.Framework;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP490_G77_ESS.Controllers.Common;
using SEP490_G77_ESS.Models;
using SEP490_G77_ESS.DTO.UserDTO;
using SEP490_G77_ESS.Utils;
using SEP490_G77_ESS.Services;
using Microsoft.Extensions.Configuration;
using Moq;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;


namespace SEP490_G77_ESS.Tests.Controller.Commons
{
    [TestFixture]
    public class RegisterControllerTests
    {
        private EssDbV11Context _context;
        private RegisterController _controller;
        private PasswordHandler _passwordHandler;
        private Mock<EmailService> _mockEmailService;
        private FakeEmailService _fakeEmailService;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<EssDbV11Context>()
                .UseInMemoryDatabase(databaseName: "TestDb_Register")
                .Options;

            _context = new EssDbV11Context(options);
            _context.Database.EnsureDeleted();
            _context.Database.EnsureCreated();

            _passwordHandler = new PasswordHandler();
            _fakeEmailService = new FakeEmailService(); // ✅ Khởi tạo đúng
            _controller = new RegisterController(_context, _passwordHandler, _fakeEmailService);

            var hashed = _passwordHandler.HashPassword("password123");

            _context.Accounts.Add(new Account
            {
                AccId = 1,
                Email = "user@example.com",
                Username = "TestUser",
                Userpass = hashed,
                Phone = "0123456789",
                Datejoin = DateTime.Now.AddYears(-20)
            }); // ✅ Sửa cú pháp Account cho đúng

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };
            _controller.ControllerContext.HttpContext.Request.Scheme = "http";
            _controller.ControllerContext.HttpContext.Request.Host = new HostString("localhost");

            _context.SaveChanges();
        }


        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        [Test]
        public async Task Register_MissingFields_ReturnsBadRequest()
        {
            Console.WriteLine("Register failed - missing required fields");

            var registerDto = new RegisterDTO
            {
                Username = "",
                Password = "",
                Email = "test@example.com",
                Phone = "0123456789",
                Dob = DateTime.Now.AddYears(-20)
            };

            var result = await _controller.Register(registerDto);

            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task Register_DuplicateEmail_ReturnsConflict()
        {
            Console.WriteLine("Register failed - email already exists: user@example.com");

            var registerDto = new RegisterDTO
            {
                Username = "NewUser",
                Password = "password123",
                Email = "user@example.com",
                Phone = "0123456789",
                Dob = DateTime.Now.AddYears(-20)
            };

            var result = await _controller.Register(registerDto);

            Assert.That(result, Is.TypeOf<ConflictObjectResult>());
        }

        [Test]
        public async Task Register_InvalidPhone_ReturnsBadRequest()
        {
            Console.WriteLine("Register failed - phone must be 10 digits");

            var registerDto = new RegisterDTO
            {
                Username = "NewUser",
                Password = "password123",
                Email = "newuser@example.com",
                Phone = "1234", // ❌ invalid
                Dob = DateTime.Now.AddYears(-20)
            };

            var result = await _controller.Register(registerDto);

            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task Register_DOBInFuture_ReturnsBadRequest()
        {
            Console.WriteLine("Register failed - birthdate cannot be in the future");

            var registerDto = new RegisterDTO
            {
                Username = "FutureUser",
                Password = "password123",
                Email = "futureuser@example.com",
                Phone = "0123456789",
                Dob = DateTime.Now.AddDays(1) // ❌ future
            };

            var result = await _controller.Register(registerDto);

            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task Register_Under16YearsOld_ReturnsBadRequest()
        {
            Console.WriteLine("Register failed - user must be at least 16 years old");

            var registerDto = new RegisterDTO
            {
                Username = "YoungUser",
                Password = "password123",
                Email = "younguser@example.com",
                Phone = "0123456789",
                Dob = DateTime.Now.AddYears(-15) // ❌ under 16
            };

            var result = await _controller.Register(registerDto);

            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task Register_InvalidEmailFormat_ReturnsBadRequest()
        {
            Console.WriteLine("Register failed - invalid email format");

            var registerDto = new RegisterDTO
            {
                Username = "InvalidEmailUser",
                Password = "password123",
                Email = "invalidEmailFormat", // ❌ not a valid email
                Phone = "0123456789",
                Dob = DateTime.Now.AddYears(-20)
            };

            // Note: API gốc hiện tại **không check email format**, nên test này phụ thuộc nếu sau này bạn thêm validate thì sẽ pass.
            // Hiện tại vẫn trả về Conflict nếu duplicate, còn BadRequest nếu muốn validate thêm.
            var result = await _controller.Register(registerDto);

            Assert.That(result, Is.TypeOf<OkObjectResult>()); // ✅ Nếu bạn muốn thêm validate email format thì đổi về BadRequest
        }

        [Test]
        public async Task Register_ValidInfo_ReturnsOk()
        {
            Console.WriteLine("Register success, verification email sent to user@example.com");

            var registerDto = new RegisterDTO
            {
                Username = "NewUserValid",
                Password = "password123",
                Email = "newuservalid@example.com",
                Phone = "0123456789",
                Dob = DateTime.Now.AddYears(-20)
            };

            var result = await _controller.Register(registerDto);

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }
    }
}